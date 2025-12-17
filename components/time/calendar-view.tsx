'use client'

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { Area, Project, TimeEntry } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

type TimeEntryWithDetails = TimeEntry & {
  project: Project & {
    area: Area
  }
}

type CalendarViewProps = {
  entries: TimeEntryWithDetails[]
  currentDate: Date
}

export function CalendarView({ entries, currentDate }: CalendarViewProps) {
  const router = useRouter()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const dateFormat = 'd'
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate =
      direction === 'prev'
        ? subMonths(currentDate, 1)
        : addMonths(currentDate, 1)
    const dateString = format(newDate, 'yyyy-MM-dd')
    const params = new URLSearchParams(window.location.search)
    params.set('date', dateString)
    router.push(`/time?${params.toString()}`)
  }

  // Calculate monthly stats
  const monthlyEntries = entries.filter((entry) =>
    isSameMonth(new Date(entry.startTime), currentDate),
  )

  const totalMinutes = monthlyEntries.reduce(
    (acc, entry) => acc + entry.durationMinutes,
    0,
  )
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-3xl">{totalHours}h</h2>
          <p className="text-muted-foreground">Total time this month</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigateMonth('prev')}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center font-medium">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <Button
            onClick={() => navigateMonth('next')}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden rounded-lg border bg-background">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {weekDays.map((day) => (
            <div
              className="border-r p-2 text-center font-medium text-muted-foreground text-xs uppercase last:border-r-0"
              key={day}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid auto-rows-fr grid-cols-7">
          {days.map((day, dayIdx) => {
            const dayEntries = entries.filter((entry) =>
              isSameDay(new Date(entry.startTime), day),
            )
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isToday = isSameDay(day, new Date())

            // Determine border classes
            const isLastRow = dayIdx >= days.length - 7
            const isLastCol = (dayIdx + 1) % 7 === 0

            return (
              <div
                className={cn(
                  'min-h-[120px] border-r border-b p-2 transition-colors hover:bg-muted/50',
                  isCurrentMonth ? '' : 'bg-muted/10 text-muted-foreground',
                  isLastRow ? 'border-b-0' : '',
                  isLastCol ? 'border-r-0' : '',
                )}
                key={day.toString()}
              >
                <div className="mb-2 flex items-start justify-between">
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full font-medium text-sm',
                      isToday ? 'bg-primary text-primary-foreground' : '',
                    )}
                  >
                    {format(day, dateFormat)}
                  </span>
                </div>

                <div className="space-y-1">
                  {dayEntries.map((entry) => (
                    <div
                      className="flex items-center gap-1 truncate rounded bg-muted p-1 text-xs"
                      key={entry.id}
                      title={`${entry.project.name}: ${entry.description}`}
                    >
                      <div
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.project.area.color }}
                      />
                      <span className="truncate font-medium">
                        {entry.project.name}
                      </span>
                      <span className="shrink-0 opacity-70">
                        ({Math.round((entry.durationMinutes / 60) * 10) / 10}h)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
