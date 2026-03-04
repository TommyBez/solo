'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { CalendarClock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
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
import {
  createTimeEntry,
  scheduleTasksForFollowingWeek,
} from '@/lib/actions/time-entries'
import { useSettingsContext } from '@/lib/context/settings-context'
import type { Area, Project } from '@/lib/db/schema'
import { parseDuration } from '@/lib/utils/duration-parser'

interface ScheduleNextWeekDialogProps {
  projects: (Project & { area: Area })[]
  referenceDateIso: string
}

function formatTaskCount(value: number) {
  return `${value} task${value === 1 ? '' : 's'}`
}

const manualTaskSchema = z.object({
  projectId: z.string().min(1, 'Please select a project'),
  description: z.string(),
  dayOffset: z.string(),
  durationInput: z.string().refine(
    (val) => {
      if (!val.trim()) return false
      const parsed = parseDuration(val)
      return parsed.isValid && parsed.minutes > 0
    },
    { message: 'Use "1h 30m", "90m", or "1.5h"' },
  ),
})

type ManualTaskFormValues = z.infer<typeof manualTaskSchema>

export function ScheduleNextWeekDialog({
  projects,
  referenceDateIso,
}: ScheduleNextWeekDialogProps) {
  const router = useRouter()
  const { settings, formatDate } = useSettingsContext()
  const weekStartsOn = settings.weekStartsOn === '0' ? 0 : 1
  const [open, setOpen] = useState(false)
  const [isCopying, startCopying] = useTransition()

  const form = useForm<ManualTaskFormValues>({
    resolver: zodResolver(manualTaskSchema),
    defaultValues: {
      projectId: '',
      description: '',
      dayOffset: '0',
      durationInput: '1h',
    },
  })
  const isCreating = form.formState.isSubmitting

  const sourceWeekStart = useMemo(() => {
    const referenceDate = parseISO(referenceDateIso)
    return startOfWeek(referenceDate, {
      weekStartsOn,
    })
  }, [referenceDateIso, weekStartsOn])

  const sourceWeekLabel = useMemo(() => {
    const sourceWeekEnd = endOfWeek(sourceWeekStart, {
      weekStartsOn,
    })
    return `${formatDate(sourceWeekStart, 'MMM d')} - ${formatDate(sourceWeekEnd, 'MMM d, yyyy')}`
  }, [sourceWeekStart, formatDate, weekStartsOn])

  const nextWeekStart = useMemo(
    () => addWeeks(sourceWeekStart, 1),
    [sourceWeekStart],
  )

  const targetWeekLabel = useMemo(() => {
    const nextWeekEnd = endOfWeek(nextWeekStart, {
      weekStartsOn,
    })
    return `${formatDate(nextWeekStart, 'MMM d')} - ${formatDate(nextWeekEnd, 'MMM d, yyyy')}`
  }, [nextWeekStart, formatDate, weekStartsOn])

  const nextWeekDayOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, dayOffset) => {
        const date = addDays(nextWeekStart, dayOffset)
        return {
          dayOffset: dayOffset.toString(),
          label: format(date, 'EEEE'),
          dateLabel: formatDate(date, 'MMM d'),
        }
      }),
    [nextWeekStart, formatDate],
  )

  const projectsByArea = useMemo(
    () =>
      projects.reduce(
        (acc, project) => {
          const areaName = project.area.name
          if (!acc[areaName]) {
            acc[areaName] = {
              area: project.area,
              projects: [],
            }
          }
          acc[areaName].projects.push(project)
          return acc
        },
        {} as Record<string, { area: Area; projects: typeof projects }>,
      ),
    [projects],
  )

  const handleSchedule = () => {
    startCopying(async () => {
      try {
        const result = await scheduleTasksForFollowingWeek(referenceDateIso)
        if (result.sourceCount === 0) {
          toast.info('No tasks found in this week to schedule')
        } else if (result.createdCount === 0) {
          const verb = result.sourceCount === 1 ? 'is' : 'are'
          toast.info(
            `All ${formatTaskCount(result.sourceCount)} ${verb} already scheduled`,
          )
        } else {
          const skippedSuffix =
            result.skippedCount > 0
              ? ` (${formatTaskCount(result.skippedCount)} skipped as duplicates)`
              : ''
          toast.success(
            `Scheduled ${formatTaskCount(result.createdCount)} for next week${skippedSuffix}`,
          )
        }
        router.refresh()
      } catch {
        toast.error('Failed to schedule tasks for next week')
      }
    })
  }

  const handleCreateManualTask = form.handleSubmit(async (values) => {
    const parsed = parseDuration(values.durationInput)
    const dayOffset = Number.parseInt(values.dayOffset, 10)
    const selectedDate = addDays(nextWeekStart, dayOffset)
    const startTime = new Date(selectedDate)
    startTime.setHours(9, 0, 0, 0)
    const endTime = new Date(startTime.getTime() + parsed.minutes * 60 * 1000)

    try {
      await createTimeEntry({
        projectId: Number.parseInt(values.projectId, 10),
        description: values.description.trim() || undefined,
        startTime,
        endTime,
        durationMinutes: parsed.minutes,
      })
      toast.success('Task created for next week')
      form.reset()
      router.refresh()
    } catch {
      toast.error('Failed to create next-week task')
    }
  })

  const isBusy = isCopying || isCreating

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarClock className="mr-2 size-4" />
          Schedule Next Week
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Schedule Tasks for Following Week</DialogTitle>
          <DialogDescription>
            Copy current tasks or create new ones directly in next week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Source week</span>
              <span className="font-medium">{sourceWeekLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Scheduled into</span>
              <span className="font-medium">{targetWeekLabel}</span>
            </div>
            <p className="text-muted-foreground text-xs">
              Existing matching tasks in the target week are skipped
              automatically.
            </p>
            <Button
              disabled={isBusy}
              onClick={handleSchedule}
              variant="outline"
            >
              {isCopying ? 'Copying...' : 'Copy current week tasks'}
            </Button>
          </div>

          <Separator />

          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <h3 className="font-medium text-sm">Create task independently</h3>
              <p className="text-muted-foreground text-xs">
                Add a task directly in {targetWeekLabel}.
              </p>
            </div>

            {projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Add at least one active project to create a task.
              </p>
            ) : (
              <Form {...form}>
                <form onSubmit={handleCreateManualTask} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select
                          disabled={isBusy}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(projectsByArea).map(
                              ([areaName, { area, projects: areaProjects }]) => (
                                <SelectGroup key={areaName}>
                                  <SelectLabel className="flex items-center gap-2">
                                    <div
                                      className="size-2 rounded-full"
                                      style={{ backgroundColor: area.color }}
                                    />
                                    {areaName}
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

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="dayOffset"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day</FormLabel>
                          <Select
                            disabled={isBusy}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {nextWeekDayOptions.map((day) => (
                                <SelectItem key={day.dayOffset} value={day.dayOffset}>
                                  {day.label} ({day.dateLabel})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                            <Input
                              disabled={isBusy}
                              placeholder="1h 30m"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            disabled={isBusy}
                            placeholder="What needs to be done?"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    disabled={isBusy}
                    type="submit"
                  >
                    {isCreating ? 'Creating...' : 'Create next-week task'}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={isBusy}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
