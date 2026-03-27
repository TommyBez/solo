'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ColorDot } from '@/components/color-indicator'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { createTimeEntry, updateTimeEntry } from '@/lib/actions/time-entries'
import { useSettingsContext } from '@/lib/context/settings-context'
import type { Area, Project, TimeEntry } from '@/lib/db/schema'
import {
  addRecentProject,
  getRecentProjects,
} from '@/lib/hooks/use-persisted-timer'
import { cn } from '@/lib/utils'
import {
  formatDurationForInput,
  parseDuration,
} from '@/lib/utils/duration-parser'

interface TimeEntryFormProps {
  entry?: TimeEntry
  initialValues?: TimeEntryInitialValues
  onSuccess?: () => void
  projects: (Project & { area: Area })[]
}

export interface TimeEntryInitialValues {
  date?: Date | string
  description?: string
  durationMinutes?: number
  projectId?: string
}

const timeEntrySchema = z.object({
  projectId: z.string().min(1, 'Please select a project'),
  description: z.string(),
  date: z.date(),
  durationInput: z.string().refine(
    (val) => {
      if (!val.trim()) {
        return false
      }
      const parsed = parseDuration(val)
      return parsed.isValid && parsed.minutes > 0
    },
    { message: 'Please enter a valid duration (e.g. "1h 30m", "90m", "1.5h")' },
  ),
})

type TimeEntryFormValues = z.infer<typeof timeEntrySchema>

export function TimeEntryForm({
  entry,
  projects,
  initialValues,
  onSuccess,
}: TimeEntryFormProps) {
  const router = useRouter()
  const { settings, formatDate } = useSettingsContext()
  const weekStartsOn = settings.weekStartsOn === '0' ? 0 : 1
  const isEditing = !!entry
  const initialDateValue = initialValues?.date
    ? new Date(initialValues.date)
    : undefined
  const initialDurationInput =
    typeof initialValues?.durationMinutes === 'number' &&
    initialValues.durationMinutes > 0
      ? formatDurationForInput(initialValues.durationMinutes)
      : undefined

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      projectId: entry?.projectId?.toString() ?? initialValues?.projectId ?? '',
      description: entry?.description ?? initialValues?.description ?? '',
      date: entry?.startTime
        ? new Date(entry.startTime)
        : (initialDateValue ?? new Date()),
      durationInput: entry
        ? formatDurationForInput(entry.durationMinutes)
        : (initialDurationInput ?? '1h'),
    },
  })
  const isLoading = form.formState.isSubmitting
  const [recentProjectIds] = useState<string[]>(() => getRecentProjects())

  // Deduplicate projects by id to prevent duplicate key errors
  const uniqueProjects = projects.filter(
    (project, index, self) =>
      index === self.findIndex((p) => p.id === project.id),
  )

  // Get recent projects that still exist
  const recentProjects = recentProjectIds
    .map((id) => uniqueProjects.find((p) => p.id.toString() === id))
    .filter((p): p is Project & { area: Area } => p !== undefined)

  const recentProjectIdSet = new Set(
    recentProjects.map((project) => project.id.toString()),
  )

  // Group remaining projects by area (excluding those already shown in "Recent")
  const projectsByArea = uniqueProjects.reduce(
    (acc, project) => {
      if (recentProjectIdSet.has(project.id.toString())) {
        return acc
      }

      const areaKey = project.area.id.toString()
      if (!acc[areaKey]) {
        acc[areaKey] = {
          area: project.area,
          projects: [],
        }
      }
      acc[areaKey].projects.push(project)
      return acc
    },
    {} as Record<string, { area: Area; projects: typeof uniqueProjects }>,
  )

  // Get duration preview from current input
  const durationInput = form.watch('durationInput')
  const parsed = parseDuration(durationInput)
  const durationPreview =
    parsed.isValid && parsed.minutes > 0 ? parsed.formatted : null

  const handleSubmit = form.handleSubmit(async (values) => {
    const durationParsed = parseDuration(values.durationInput)
    const durationMinutes = durationParsed.minutes
    const startTime = new Date(values.date)
    startTime.setHours(9, 0, 0, 0)
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

    try {
      if (isEditing) {
        await updateTimeEntry(entry.id, {
          ...(values.projectId && {
            projectId: Number.parseInt(values.projectId, 10),
          }),
          description: values.description.trim() || undefined,
          startTime,
          endTime,
          durationMinutes,
        })
        toast.success('Time entry updated')
      } else {
        await createTimeEntry({
          projectId: Number.parseInt(values.projectId, 10),
          description: values.description.trim() || undefined,
          startTime,
          endTime,
          durationMinutes,
        })
        // Add to recent projects
        addRecentProject(values.projectId)
        toast.success('Time entry added')
      }
      onSuccess?.()
      router.refresh()
    } catch {
      toast.error(isEditing ? 'Failed to update entry' : 'Failed to add entry')
    }
  })

  let buttonText = 'Add Entry'
  if (isLoading) {
    buttonText = 'Saving...'
  } else if (isEditing) {
    buttonText = 'Update Entry'
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select
                disabled={isLoading}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {recentProjects.length > 0 && (
                    <>
                      <SelectGroup>
                        <SelectLabel className="flex items-center gap-2">
                          <Clock className="size-3" />
                          Recent
                        </SelectLabel>
                        {recentProjects.map((project) => (
                          <SelectItem
                            key={`recent-${project.id}`}
                            value={project.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <ColorDot color={project.area.color} />
                              {project.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <Separator className="my-1" />
                    </>
                  )}
                  {Object.values(projectsByArea).map(
                    ({ area, projects: areaProjects }) => (
                      <SelectGroup key={area.id}>
                        <SelectLabel className="flex items-center gap-2">
                          <ColorDot color={area.color} />
                          {area.name}
                        </SelectLabel>
                        {areaProjects.map((project) => (
                          <SelectItem
                            key={project.id}
                            value={project.id.toString()}
                          >
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ),
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  disabled={isLoading}
                  placeholder="What did you work on?"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      className={cn(
                        'w-full justify-start text-left font-normal',
                      )}
                      disabled={isLoading}
                      variant="outline"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {formatDate(field.value, 'PPP')}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    onSelect={(d) => {
                      if (d) {
                        field.onChange(d)
                      }
                    }}
                    selected={field.value}
                    weekStartsOn={weekStartsOn}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="durationInput"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    className={cn(
                      'pr-20',
                      form.formState.errors.durationInput &&
                        'border-destructive focus-visible:ring-destructive',
                    )}
                    disabled={isLoading}
                    placeholder="e.g. 1h 30m, 90m, 1.5h"
                    {...field}
                  />
                  {durationPreview ? (
                    <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5 text-muted-foreground text-sm">
                      <Clock className="size-3.5" />
                      <span>{durationPreview}</span>
                    </div>
                  ) : null}
                </div>
              </FormControl>
              <FormMessage />
              <FormDescription>
                Examples: &quot;1h 30m&quot;, &quot;90m&quot;, &quot;1.5h&quot;,
                &quot;1:30&quot;
              </FormDescription>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button disabled={isLoading} type="submit">
            {buttonText}
          </Button>
        </div>
      </form>
    </Form>
  )
}
