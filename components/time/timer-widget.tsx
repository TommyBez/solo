'use client'

import { Clock, Pause, Play, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { createTimeEntry } from '@/lib/actions/time-entries'
import type { Area, Project } from '@/lib/db/schema'
import {
  SHORTCUT_EVENTS,
  useShortcutEvent,
} from '@/lib/hooks/use-keyboard-shortcuts'
import {
  addRecentProject,
  getRecentProjects,
  usePersistedTimer,
} from '@/lib/hooks/use-persisted-timer'

interface TimerWidgetProps {
  projects: (Project & { area: Area })[]
}

export function TimerWidget({ projects }: TimerWidgetProps) {
  const router = useRouter()
  const {
    isRunning,
    seconds,
    projectId,
    description,
    startTime,
    isHydrated,
    start,
    pause,
    stop,
    setProjectId,
    setDescription,
  } = usePersistedTimer()

  const [recentProjectIds, setRecentProjectIds] = useState<string[]>([])

  // Load recent projects on mount
  useEffect(() => {
    setRecentProjectIds(getRecentProjects())
  }, [])

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
    start()
  }

  const handlePause = () => {
    pause()
  }

  const handleStop = useCallback(async () => {
    if (!(projectId && startTime)) {
      return
    }

    const timerData = stop()
    const durationMinutes = Math.max(1, Math.round(timerData.seconds / 60))

    try {
      await createTimeEntry({
        projectId: Number.parseInt(timerData.projectId, 10),
        description: timerData.description.trim() || undefined,
        startTime: timerData.startTime as Date,
        endTime: new Date(),
        durationMinutes,
      })
      // Add to recent projects
      addRecentProject(timerData.projectId)
      setRecentProjectIds(getRecentProjects())
      toast.success(`Logged ${durationMinutes} minutes`)
      router.refresh()
    } catch {
      toast.error('Failed to save time entry')
    }
  }, [projectId, startTime, stop, router])

  const handleProjectChange = (value: string) => {
    setProjectId(value)
  }

  // Handle keyboard shortcut to toggle timer
  const handleToggleTimer = useCallback(() => {
    if (isRunning) {
      pause()
      toast.info('Timer paused')
    } else if (projectId) {
      start()
      toast.info('Timer started')
    } else {
      toast.error('Please select a project first')
    }
  }, [isRunning, projectId, pause, start])

  useShortcutEvent(SHORTCUT_EVENTS.TOGGLE_TIMER, handleToggleTimer)

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

  const selectedProject = projects.find((p) => p.id.toString() === projectId)

  // Show skeleton while hydrating to prevent flash
  if (!isHydrated) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 animate-pulse rounded-md bg-muted" />
          <div className="h-10 animate-pulse rounded-md bg-muted" />
          <div className="flex items-center justify-between">
            <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Timer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          disabled={isRunning}
          onValueChange={handleProjectChange}
          value={projectId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
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
