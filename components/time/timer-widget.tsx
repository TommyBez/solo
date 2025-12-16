'use client'

import { Pause, Play, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTimeEntry } from '@/lib/actions/time-entries'
import type { Area, Project } from '@/lib/db/schema'

interface TimerWidgetProps {
  projects: (Project & { area: Area })[]
}

export function TimerWidget({ projects }: TimerWidgetProps) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [projectId, setProjectId] = useState('')
  const [description, setDescription] = useState('')
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
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    if (!projectId) {
      toast.error('Please select a project first')
      return
    }
    setIsRunning(true)
    setStartTime(new Date())
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleStop = useCallback(async () => {
    if (!(projectId && startTime)) return

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
      toast.error('Failed to save time entry')
    }

    setSeconds(0)
    setStartTime(null)
    setDescription('')
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
        <Select
          disabled={isRunning}
          onValueChange={setProjectId}
          value={projectId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(projectsByArea).map(
              ([areaName, { area, projects: areaProjects }]) => (
                <div key={areaName}>
                  <div className="flex items-center gap-2 px-2 py-1.5 font-semibold text-muted-foreground text-xs">
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: area.color }}
                    />
                    {areaName}
                  </div>
                  {areaProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </div>
              ),
            )}
          </SelectContent>
        </Select>

        <Input
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you working on?"
          value={description}
        />

        {selectedProject ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div
              className="size-2 rounded-full"
              style={{ backgroundColor: selectedProject.area.color }}
            />
            <span>{selectedProject.area.name}</span>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="font-bold font-mono text-3xl tabular-nums">
            {formatTime(seconds)}
          </span>
          <div className="flex gap-2">
            {isRunning ? (
              <>
                <Button
                  className="size-10 rounded-full"
                  onClick={handlePause}
                  size="icon"
                  variant="secondary"
                >
                  <Pause className="size-5" />
                  <span className="sr-only">Pause timer</span>
                </Button>
                <Button
                  className="size-10 rounded-full"
                  onClick={handleStop}
                  size="icon"
                  variant="destructive"
                >
                  <Square className="size-5" />
                  <span className="sr-only">Stop and save</span>
                </Button>
              </>
            ) : (
              <Button
                className="size-10 rounded-full"
                onClick={handleStart}
                size="icon"
              >
                <Play className="size-5" />
                <span className="sr-only">Start timer</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
