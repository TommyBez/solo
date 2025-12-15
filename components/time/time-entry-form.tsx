"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { createTimeEntry, updateTimeEntry } from "@/lib/actions/time-entries"
import type { TimeEntry, Project, Area } from "@/lib/db/schema"

interface TimeEntryFormProps {
  entry?: TimeEntry
  projects: (Project & { area: Area })[]
  onSuccess?: () => void
}

export function TimeEntryForm({ entry, projects, onSuccess }: TimeEntryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [projectId, setProjectId] = useState(entry?.projectId?.toString() ?? "")
  const [description, setDescription] = useState(entry?.description ?? "")
  const [date, setDate] = useState<Date>(entry?.startTime ? new Date(entry.startTime) : new Date())
  const [hours, setHours] = useState(entry ? Math.floor(entry.durationMinutes / 60) : 1)
  const [minutes, setMinutes] = useState(entry ? entry.durationMinutes % 60 : 0)

  const isEditing = !!entry

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId) {
      toast.error("Please select a project")
      return
    }

    const durationMinutes = hours * 60 + minutes
    if (durationMinutes <= 0) {
      toast.error("Duration must be greater than 0")
      return
    }

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
        toast.success("Time entry updated")
      } else {
        await createTimeEntry({
          projectId: Number.parseInt(projectId),
          description: description.trim() || undefined,
          startTime,
          endTime,
          durationMinutes,
        })
        toast.success("Time entry added")
      }
      router.refresh()
      onSuccess?.()
    } catch {
      toast.error(isEditing ? "Failed to update entry" : "Failed to add entry")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project">Project</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(projectsByArea).map(([areaName, { area, projects: areaProjects }]) => (
              <div key={areaName}>
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  <div className="size-2 rounded-full" style={{ backgroundColor: area.color }} />
                  {areaName}
                </div>
                {areaProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you work on?"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 size-4" />
              {format(date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Duration</Label>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">h</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={59}
              step={5}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">m</span>
          </div>
          <Clock className="ml-2 size-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEditing ? "Update Entry" : "Add Entry"}
        </Button>
      </div>
    </form>
  )
}
