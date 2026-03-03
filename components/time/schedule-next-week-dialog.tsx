'use client'

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
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { Area, Project } from '@/lib/db/schema'
import { parseDuration } from '@/lib/utils/duration-parser'

interface ScheduleNextWeekDialogProps {
  projects: (Project & { area: Area })[]
  referenceDateIso: string
}

const WEEK_STARTS_ON_MONDAY = 1 as const

function formatTaskCount(value: number) {
  return `${value} task${value === 1 ? '' : 's'}`
}

export function ScheduleNextWeekDialog({
  projects,
  referenceDateIso,
}: ScheduleNextWeekDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isCopying, startCopying] = useTransition()
  const [isCreating, startCreating] = useTransition()
  const [manualTask, setManualTask] = useState(() => ({
    projectId: '',
    description: '',
    dayOffset: '0',
    durationInput: '1h',
    durationError: null as string | null,
  }))

  const sourceWeekStart = useMemo(() => {
    const referenceDate = parseISO(referenceDateIso)
    return startOfWeek(referenceDate, {
      weekStartsOn: WEEK_STARTS_ON_MONDAY,
    })
  }, [referenceDateIso])

  const sourceWeekLabel = useMemo(() => {
    const sourceWeekEnd = endOfWeek(sourceWeekStart, {
      weekStartsOn: WEEK_STARTS_ON_MONDAY,
    })
    return `${format(sourceWeekStart, 'MMM d')} - ${format(sourceWeekEnd, 'MMM d, yyyy')}`
  }, [sourceWeekStart])

  const nextWeekStart = useMemo(
    () => addWeeks(sourceWeekStart, 1),
    [sourceWeekStart],
  )

  const targetWeekLabel = useMemo(() => {
    const nextWeekEnd = endOfWeek(nextWeekStart, {
      weekStartsOn: WEEK_STARTS_ON_MONDAY,
    })
    return `${format(nextWeekStart, 'MMM d')} - ${format(nextWeekEnd, 'MMM d, yyyy')}`
  }, [nextWeekStart])

  const nextWeekDayOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, dayOffset) => {
        const date = addDays(nextWeekStart, dayOffset)
        return {
          dayOffset: dayOffset.toString(),
          label: format(date, 'EEEE'),
          dateLabel: format(date, 'MMM d'),
        }
      }),
    [nextWeekStart],
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

  function handleDurationChange(value: string) {
    let durationError: string | null = null
    const parsed = parseDuration(value)

    if (value.trim() && !parsed.isValid) {
      durationError = 'Use "1h 30m", "90m", or "1.5h"'
    } else if (parsed.isValid && parsed.minutes <= 0 && value.trim()) {
      durationError = 'Duration must be greater than 0'
    }

    setManualTask((prev) => ({
      ...prev,
      durationInput: value,
      durationError,
    }))
  }

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

  const handleCreateManualTask = () => {
    if (!manualTask.projectId) {
      toast.error('Please select a project')
      return
    }

    const parsed = parseDuration(manualTask.durationInput)
    if (!parsed.isValid || parsed.minutes <= 0) {
      toast.error('Please enter a valid duration')
      return
    }

    const dayOffset = Number.parseInt(manualTask.dayOffset, 10)
    const selectedDate = addDays(nextWeekStart, dayOffset)
    const startTime = new Date(selectedDate)
    startTime.setHours(9, 0, 0, 0)
    const endTime = new Date(startTime.getTime() + parsed.minutes * 60 * 1000)

    startCreating(async () => {
      try {
        await createTimeEntry({
          projectId: Number.parseInt(manualTask.projectId, 10),
          description: manualTask.description.trim() || undefined,
          startTime,
          endTime,
          durationMinutes: parsed.minutes,
        })
        toast.success('Task created for next week')
        setManualTask({
          projectId: '',
          description: '',
          dayOffset: '0',
          durationInput: '1h',
          durationError: null,
        })
        router.refresh()
      } catch {
        toast.error('Failed to create next-week task')
      }
    })
  }

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
              <>
                <div className="space-y-2">
                  <Label htmlFor="next-week-project">Project</Label>
                  <Select
                    onValueChange={(projectId) => {
                      setManualTask((prev) => ({ ...prev, projectId }))
                    }}
                    value={manualTask.projectId}
                  >
                    <SelectTrigger id="next-week-project">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="next-week-day">Day</Label>
                    <Select
                      onValueChange={(dayOffset) => {
                        setManualTask((prev) => ({ ...prev, dayOffset }))
                      }}
                      value={manualTask.dayOffset}
                    >
                      <SelectTrigger id="next-week-day">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {nextWeekDayOptions.map((day) => (
                          <SelectItem key={day.dayOffset} value={day.dayOffset}>
                            {day.label} ({day.dateLabel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next-week-duration">Duration</Label>
                    <Input
                      id="next-week-duration"
                      onChange={(event) =>
                        handleDurationChange(event.target.value)
                      }
                      placeholder="1h 30m"
                      value={manualTask.durationInput}
                    />
                    {manualTask.durationError ? (
                      <p className="text-destructive text-xs">
                        {manualTask.durationError}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next-week-description">Description</Label>
                  <Textarea
                    id="next-week-description"
                    onChange={(event) => {
                      setManualTask((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }}
                    placeholder="What needs to be done?"
                    rows={2}
                    value={manualTask.description}
                  />
                </div>
                <Button
                  disabled={isBusy || !!manualTask.durationError}
                  onClick={handleCreateManualTask}
                >
                  {isCreating ? 'Creating...' : 'Create next-week task'}
                </Button>
              </>
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
