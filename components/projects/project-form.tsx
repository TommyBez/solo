'use client'

import { CalendarIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { Area, Project } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

interface ProjectFormProps {
  areas: Area[]
  onSuccess?: () => void
  project?: Project & { area?: Area }
}

interface ProjectFormState {
  areaId: string
  deadline: Date | undefined
  description: string
  expectedHours: number
  name: string
  recurring: boolean
  status: string
}

export function ProjectForm({ project, areas, onSuccess }: ProjectFormProps) {
  const router = useRouter()
  const { settings, formatDate } = useSettingsContext()
  const weekStartsOn = settings.weekStartsOn === '0' ? 0 : 1
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<ProjectFormState>(() => ({
    name: project?.name ?? '',
    description: project?.description ?? '',
    areaId: project?.areaId?.toString() ?? '',
    status: project?.status ?? 'active',
    expectedHours: project?.expectedHours ?? 0,
    recurring: project?.recurring ?? false,
    deadline: project?.deadline ? new Date(project.deadline) : undefined,
  }))

  const isEditing = !!project

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!form.areaId) {
      toast.error('Please select an area')
      return
    }

    setIsLoading(true)
    try {
      if (isEditing) {
        await updateProject(project.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          status: form.status,
          expectedHours: form.expectedHours,
          recurring: form.recurring,
          deadline: form.deadline || null,
        })
        toast.success('Project updated successfully')
      } else {
        await createProject({
          areaId: Number.parseInt(form.areaId, 10),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          status: form.status,
          expectedHours: form.expectedHours,
          recurring: form.recurring,
          deadline: form.deadline,
        })
        toast.success('Project created successfully')
      }
      router.refresh()
      onSuccess?.()
    } catch {
      toast.error(
        isEditing ? 'Failed to update project' : 'Failed to create project',
      )
    } finally {
      setIsLoading(false)
    }
  }

  let buttonText = 'Create Project'
  if (isLoading) {
    buttonText = 'Saving...'
  } else if (isEditing) {
    buttonText = 'Update Project'
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="area">Area</Label>
        <Select
          disabled={isEditing}
          onValueChange={(areaId) => {
            setForm((prev) => ({ ...prev, areaId }))
          }}
          value={form.areaId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an area" />
          </SelectTrigger>
          <SelectContent>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id.toString()}>
                <div className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: area.color }}
                  />
                  {area.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          onChange={(e) => {
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }}
          placeholder="e.g., CTO for XY Agency"
          required
          value={form.name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          onChange={(e) => {
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }}
          placeholder="Brief description of this project..."
          rows={3}
          value={form.description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            onValueChange={(status) => {
              setForm((prev) => ({ ...prev, status }))
            }}
            value={form.status}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4 rounded-md border p-3">
            <div className="space-y-1">
              <Label htmlFor="project-recurring">Recurring Project</Label>
            </div>
            <Toggle
              id="project-recurring"
              onPressedChange={(recurring) => {
                setForm((prev) => ({ ...prev, recurring: !!recurring }))
              }}
              pressed={form.recurring}
              size="sm"
              variant="outline"
            >
              {form.recurring ? 'On' : 'Off'}
            </Toggle>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedHours">
            {form.recurring ? 'Expected Hours per Week' : 'Expected Hours'}
          </Label>
          <Input
            id="expectedHours"
            max={form.recurring ? 168 : undefined}
            min={0}
            onChange={(e) => {
              setForm((prev) => ({
                ...prev,
                expectedHours: Number(e.target.value),
              }))
            }}
            type="number"
            value={form.expectedHours}
          />
          <p className="text-muted-foreground text-xs">
            {form.recurring
              ? 'Used to track weekly progress for recurring projects.'
              : 'Used as a one-time total estimate for this project.'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Deadline</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className={cn(
                'w-full justify-start text-left font-normal',
                !form.deadline && 'text-muted-foreground',
              )}
              variant="outline"
            >
              <CalendarIcon className="mr-2 size-4" />
              {form.deadline
                ? formatDate(form.deadline, 'PPP')
                : 'No deadline set'}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              onSelect={(deadline) => {
                setForm((prev) => ({ ...prev, deadline }))
              }}
              selected={form.deadline}
              weekStartsOn={weekStartsOn}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button disabled={isLoading} type="submit">
          {buttonText}
        </Button>
      </div>
    </form>
  )
}
