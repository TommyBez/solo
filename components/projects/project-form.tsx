"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { createProject, updateProject } from "@/lib/actions/projects"
import type { Project, Area } from "@/lib/db/schema"

interface ProjectFormProps {
  project?: Project & { area?: Area }
  areas: Area[]
  onSuccess?: () => void
}

export function ProjectForm({ project, areas, onSuccess }: ProjectFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(project?.name ?? "")
  const [description, setDescription] = useState(project?.description ?? "")
  const [areaId, setAreaId] = useState(project?.areaId?.toString() ?? "")
  const [status, setStatus] = useState(project?.status ?? "active")
  const [expectedHours, setExpectedHours] = useState(project?.expectedHours ?? 0)
  const [deadline, setDeadline] = useState<Date | undefined>(project?.deadline ? new Date(project.deadline) : undefined)

  const isEditing = !!project

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!areaId) {
      toast.error("Please select an area")
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
        toast.success("Project updated successfully")
      } else {
        await createProject({
          areaId: Number.parseInt(areaId),
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          expectedHours,
          deadline,
        })
        toast.success("Project created successfully")
      }
      router.refresh()
      onSuccess?.()
    } catch {
      toast.error(isEditing ? "Failed to update project" : "Failed to create project")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="area">Area</Label>
        <Select value={areaId} onValueChange={setAreaId} disabled={isEditing}>
          <SelectTrigger>
            <SelectValue placeholder="Select an area" />
          </SelectTrigger>
          <SelectContent>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id.toString()}>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full" style={{ backgroundColor: area.color }} />
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., CTO for XY Agency"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this project..."
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
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
            type="number"
            min={0}
            value={expectedHours}
            onChange={(e) => setExpectedHours(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Deadline</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 size-4" />
              {deadline ? format(deadline, "PPP") : "No deadline set"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEditing ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  )
}
