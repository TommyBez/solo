"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Play, Pause, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { createTimeEntry } from "@/lib/actions/time-entries"
import type { Project, Area } from "@/lib/db/schema"

interface TimerWidgetProps {
  projects: (Project & { area: Area })[]
}

export function TimerWidget({ projects }: TimerWidgetProps) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [projectId, setProjectId] = useState("")
  const [description, setDescription] = useState("")
  const [startTime, setStartTime] = useState<Date | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = () => {
    if (!projectId) {
      toast.error("Please select a project first")
      return
    }
    setIsRunning(true)
    setStartTime(new Date())
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleStop = useCallback(async () => {
    if (!projectId || !startTime) return

    setIsRunning(false)
    const durationMinutes = Math.max(1, Math.round(seconds / 60))

    try {
      await createTimeEntry({
        projectId: Number.parseInt(projectId),
        description: description.trim() || undefined,
        startTime,
        endTime: new Date(),
        durationMinutes,
      })
      toast.success(`Logged ${durationMinutes} minutes`)
      router.refresh()
    } catch {
      toast.error("Failed to save time entry")
    }

    setSeconds(0)
    setStartTime(null)
    setDescription("")
  }, [projectId, startTime, seconds, description, router])

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

  const selectedProject = projects.find((p) => p.id.toString() === projectId)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Timer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={projectId} onValueChange={setProjectId} disabled={isRunning}>
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
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

        <Input
          placeholder="What are you working on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {selectedProject && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="size-2 rounded-full" style={{ backgroundColor: selectedProject.area.color }} />
            <span>{selectedProject.area.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-mono text-3xl font-bold tabular-nums">{formatTime(seconds)}</span>
          <div className="flex gap-2">
            {!isRunning ? (
              <Button onClick={handleStart} size="icon" className="size-10 rounded-full">
                <Play className="size-5" />
                <span className="sr-only">Start timer</span>
              </Button>
            ) : (
              <>
                <Button onClick={handlePause} size="icon" variant="secondary" className="size-10 rounded-full">
                  <Pause className="size-5" />
                  <span className="sr-only">Pause timer</span>
                </Button>
                <Button onClick={handleStop} size="icon" variant="destructive" className="size-10 rounded-full">
                  <Square className="size-5" />
                  <span className="sr-only">Stop and save</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
