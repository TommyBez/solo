'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CalendarIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Toggle } from '@/components/ui/toggle'
import { createProject, updateProject } from '@/lib/actions/projects'
import { useSettingsContext } from '@/lib/context/settings-context'
import type { Area, Client, Project } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

interface ProjectFormProps {
  areas: Area[]
  clients?: Client[]
  onSuccess?: () => void
  project?: Project & { area?: Area }
}

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  areaId: z.string().min(1, 'Please select an area'),
  clientId: z.string(),
  status: z.string(),
  expectedHours: z.coerce.number().min(0),
  recurring: z.boolean(),
  deadline: z.date().optional(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

export function ProjectForm({
  project,
  areas,
  clients = [],
  onSuccess,
}: ProjectFormProps) {
  const router = useRouter()
  const { settings, formatDate } = useSettingsContext()
  const weekStartsOn = settings.weekStartsOn === '0' ? 0 : 1
  const isEditing = !!project
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      areaId: project?.areaId?.toString() ?? '',
      clientId: project?.clientId?.toString() ?? '',
      status: project?.status ?? 'active',
      expectedHours: project?.expectedHours ?? 0,
      recurring: project?.recurring ?? false,
      deadline: project?.deadline ? new Date(project.deadline) : undefined,
    },
  })
  const isLoading = form.formState.isSubmitting
  const recurring = form.watch('recurring')

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEditing) {
        await updateProject(project.id, {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          clientId: values.clientId ? Number(values.clientId) : null,
          status: values.status,
          expectedHours: values.expectedHours,
          recurring: values.recurring,
          deadline: values.deadline || null,
        })
        toast.success('Project updated successfully')
      } else {
        await createProject({
          areaId: Number.parseInt(values.areaId, 10),
          clientId: values.clientId ? Number(values.clientId) : undefined,
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          status: values.status,
          expectedHours: values.expectedHours,
          recurring: values.recurring,
          deadline: values.deadline,
        })
        toast.success('Project created successfully')
      }
      router.refresh()
      onSuccess?.()
    } catch {
      toast.error(
        isEditing ? 'Failed to update project' : 'Failed to create project',
      )
    }
  })

  let buttonText = 'Create Project'
  if (isLoading) {
    buttonText = 'Saving...'
  } else if (isEditing) {
    buttonText = 'Update Project'
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="areaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area</FormLabel>
              <Select
                disabled={isEditing || isLoading}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      <div className="flex items-center gap-2">
                        <ColorDot className="size-3" color={area.color} />
                        {area.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {clients.length > 0 && (
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client (optional)</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={(value) =>
                    field.onChange(value === 'none' ? '' : value)
                  }
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="No client assigned">
                        {field.value ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="size-4" />
                            {clients.find(
                              (c) => c.id.toString() === field.value,
                            )?.name ?? 'Unknown client'}
                          </div>
                        ) : (
                          'No client assigned'
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No client assigned</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4" />
                          {client.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Link this project to a client for billing
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  disabled={isLoading}
                  placeholder="e.g., CTO for XY Agency"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  disabled={isLoading}
                  placeholder="Brief description of this project..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recurring"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex items-start justify-between gap-4 rounded-md border p-3">
                    <div className="space-y-1">
                      <FormLabel>Recurring Project</FormLabel>
                    </div>
                    <Toggle
                      disabled={isLoading}
                      onPressedChange={(pressed) => field.onChange(!!pressed)}
                      pressed={field.value}
                      size="sm"
                      variant="outline"
                    >
                      {field.value ? 'On' : 'Off'}
                    </Toggle>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expectedHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {recurring ? 'Expected Hours per Week' : 'Expected Hours'}
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading}
                    max={recurring ? 168 : undefined}
                    min={0}
                    type="number"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {recurring
                    ? 'Used to track weekly progress for recurring projects.'
                    : 'Used as a one-time total estimate for this project.'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deadline</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                      disabled={isLoading}
                      variant="outline"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {field.value
                        ? formatDate(field.value, 'PPP')
                        : 'No deadline set'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    onSelect={field.onChange}
                    selected={field.value}
                    weekStartsOn={weekStartsOn}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
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
