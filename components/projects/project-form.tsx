'use client'

import { format } from 'date-fns'
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
import { createProject, updateProject } from '@/lib/actions/projects'
import type { Area, Project } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

interface ProjectFormProps {
  areas: Area[]
  onSuccess?: () => void
  project?: Project & { area?: Area }
}

export function ProjectForm({ project, areas, onSuccess }: ProjectFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [areaId, setAreaId] = useState(project?.areaId?.toString() ?? '')
  const [status, setStatus] = useState(project?.status ?? 'active')
  const [expectedHours, setExpectedHours] = useState(
    project?.expectedHours ?? 0,
  )
  const [deadline, setDeadline] = useState<Date | undefined>(
    project?.deadline ? new Date(project.deadline) : undefined,
  )

  const isEditing = !!project

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!areaId) {
      toast.error('Please select an area')
      return
    }

    setIsLoading(true)
    try {
      if (isEditing) {
        await updateProject(project.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          expectedHours,
          deadline: deadline || null,
        })
        toast.success('Project updated successfully')
      } else {
        await createProject({
          areaId: Number.parseInt(areaId, 10),
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          expectedHours,
          deadline,
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
        <Select disabled={isEditing} onValueChange={setAreaId} value={areaId}>
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
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., CTO for XY Agency"
          required
          value={name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this project..."
          rows={3}
          value={description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={setStatus} value={status}>
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
          <Label htmlFor="expectedHours">Expected Hours</Label>
          <Input
            id="expectedHours"
            min={0}
            onChange={(e) => setExpectedHours(Number(e.target.value))}
            type="number"
            value={expectedHours}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Deadline</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className={cn(
                'w-full justify-start text-left font-normal',
                !deadline && 'text-muted-foreground',
              )}
              variant="outline"
            >
              <CalendarIcon className="mr-2 size-4" />
              {deadline ? format(deadline, 'PPP') : 'No deadline set'}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              autoFocus
              mode="single"
              onSelect={setDeadline}
              selected={deadline}
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
