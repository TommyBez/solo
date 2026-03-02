'use client'

import { format } from 'date-fns'
import { CalendarIcon, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useState } from 'react'
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { createTimeEntry, updateTimeEntry } from '@/lib/actions/time-entries'
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
  onSuccess?: () => void
  projects: (Project & { area: Area })[]
}

export function TimeEntryForm({
  entry,
  projects,
  onSuccess,
}: TimeEntryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [projectId, setProjectId] = useState(entry?.projectId?.toString() ?? '')
  const [description, setDescription] = useState(entry?.description ?? '')
  const [date, setDate] = useState<Date>(
    entry?.startTime ? new Date(entry.startTime) : new Date(),
  )
  const [durationInput, setDurationInput] = useState(
    entry ? formatDurationForInput(entry.durationMinutes) : '1h',
  )
  const [durationError, setDurationError] = useState<string | null>(null)
  const [recentProjectIds, setRecentProjectIds] = useState<string[]>([])

  const isEditing = !!entry

  // Load recent projects on mount
  useEffect(() => {
    setRecentProjectIds(getRecentProjects())
  }, [])

  // Group projects by area
  const projectsByArea = projects.reduce(
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
  )

  // Get recent projects that still exist
  const recentProjects = recentProjectIds
    .map((id) => projects.find((p) => p.id.toString() === id))
    .filter((p): p is Project & { area: Area } => p !== undefined)

  const handleDurationChange = (value: string) => {
    setDurationInput(value)
    const parsed = parseDuration(value)
    if (value.trim() && !parsed.isValid) {
      setDurationError('Invalid format. Try "1h 30m", "90m", or "1.5h"')
    } else if (parsed.isValid && parsed.minutes <= 0 && value.trim()) {
      setDurationError('Duration must be greater than 0')
    } else {
      setDurationError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId) {
      toast.error('Please select a project')
      return
    }

    const parsed = parseDuration(durationInput)
    if (!parsed.isValid || parsed.minutes <= 0) {
      toast.error('Please enter a valid duration')
      return
    }

    const durationMinutes = parsed.minutes
    const startTime = new Date(date)
    startTime.setHours(9, 0, 0, 0)
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

    setIsLoading(true)
    try {
      if (isEditing) {
        await updateTimeEntry(entry.id, {
          description: description.trim() || undefined,
          startTime,
          endTime,
          durationMinutes,
        })
        toast.success('Time entry updated')
      } else {
        await createTimeEntry({
          projectId: Number.parseInt(projectId, 10),
          description: description.trim() || undefined,
          startTime,
          endTime,
          durationMinutes,
        })
        // Add to recent projects
        addRecentProject(projectId)
        toast.success('Time entry added')
      }
      router.refresh()
      onSuccess?.()
    } catch {
      toast.error(isEditing ? 'Failed to update entry' : 'Failed to add entry')
    } finally {
      setIsLoading(false)
    }
  }

  let buttonText = 'Add Entry'
  if (isLoading) {
    buttonText = 'Saving...'
  } else if (isEditing) {
    buttonText = 'Update Entry'
  }

  // Get duration preview
  const parsed = parseDuration(durationInput)
  const durationPreview =
    parsed.isValid && parsed.minutes > 0 ? parsed.formatted : null

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="project">Project</Label>
        <Select onValueChange={setProjectId} value={projectId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
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
                        <div
                          className="size-2 rounded-full"
                          style={{ backgroundColor: project.area.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <Separator className="my-1" />
              </>
            )}
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
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you work on?"
          rows={2}
          value={description}
        />
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className={cn('w-full justify-start text-left font-normal')}
              variant="outline"
            >
              <CalendarIcon className="mr-2 size-4" />
              {format(date, 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              autoFocus
              mode="single"
              onSelect={(d) => {
                if (d) {
                  setDate(d)
                }
              }}
              selected={date}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration</Label>
        <div className="relative">
          <Input
            className={cn(
              'pr-20',
              durationError &&
                'border-destructive focus-visible:ring-destructive',
            )}
            id="duration"
            onChange={(e) => handleDurationChange(e.target.value)}
            placeholder="e.g. 1h 30m, 90m, 1.5h"
            value={durationInput}
          />
          {durationPreview ? (
            <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5 text-muted-foreground text-sm">
              <Clock className="size-3.5" />
              <span>{durationPreview}</span>
            </div>
          ) : null}
        </div>
        {durationError ? (
          <p className="text-destructive text-sm">{durationError}</p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          Examples: &quot;1h 30m&quot;, &quot;90m&quot;, &quot;1.5h&quot;,
          &quot;1:30&quot;
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button disabled={isLoading || !!durationError} type="submit">
          {buttonText}
        </Button>
      </div>
    </form>
  )
}
