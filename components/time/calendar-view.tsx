'use client'

import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettingsContext } from '@/lib/context/settings-context'
import type { Area, Project, TimeEntry } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

type TimeEntryWithDetails = TimeEntry & {
  project: Project & {
    area: Area
  }
}

interface CalendarViewProps {
  currentDate: Date
  entries: TimeEntryWithDetails[]
  view: 'month' | 'week'
}

export function CalendarView({
  entries,
  currentDate,
  view,
}: CalendarViewProps) {
  const router = useRouter()
  const { settings, formatDate } = useSettingsContext()
  const weekStartsOn = settings.weekStartsOn === '0' ? 0 : 1

  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate: Date
    if (view === 'week') {
      newDate =
        direction === 'prev'
          ? subWeeks(currentDate, 1)
          : addWeeks(currentDate, 1)
    } else {
      newDate =
        direction === 'prev'
          ? subMonths(currentDate, 1)
          : addMonths(currentDate, 1)
    }
    const dateString = format(newDate, 'yyyy-MM-dd')
    const params = new URLSearchParams(window.location.search)
    params.set('date', dateString)
    router.push(`/time?${params.toString()}`)
  }

  const handleViewChange = (newView: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set('view', newView)
    router.push(`/time?${params.toString()}`)
  }

  // Calculate days to display
  let days: Date[]
  let headerTitle: string

  if (view === 'week') {
    const startDate = startOfWeek(currentDate, { weekStartsOn })
    const endDate = endOfWeek(currentDate, { weekStartsOn })
    days = eachDayOfInterval({ start: startDate, end: endDate })

    // Format: "Jul 29 - Aug 04, 2024"
    if (isSameMonth(startDate, endDate)) {
      headerTitle = `${formatDate(startDate, 'MMM d')} - ${formatDate(endDate, 'd, yyyy')}`
    } else {
      headerTitle = `${formatDate(startDate, 'MMM d')} - ${formatDate(endDate, 'MMM d, yyyy')}`
    }
  } else {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn })
    const endDate = endOfWeek(monthEnd, { weekStartsOn })
    days = eachDayOfInterval({ start: startDate, end: endDate })
    headerTitle = formatDate(currentDate, 'MMMM yyyy')
  }

  // Week days based on user's preference
  const allWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekDays =
    weekStartsOn === 0
      ? allWeekDays // Sunday start: Sun, Mon, Tue, Wed, Thu, Fri, Sat
      : [...allWeekDays.slice(1), allWeekDays[0]] // Monday start: Mon, Tue, Wed, Thu, Fri, Sat, Sun

  // Calculate stats for current view
  const totalMinutes = entries.reduce(
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
          <p className="text-muted-foreground">
            Total time this {view === 'week' ? 'week' : 'month'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs onValueChange={handleViewChange} value={view}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigateDate('prev')}
              size="icon"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[160px] text-center font-medium">
              {headerTitle}
            </span>
            <Button
              onClick={() => navigateDate('next')}
              size="icon"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
            const isToday = isSameDay(day, new Date())

            // For month view, we dim outside days. For week view, all days are "current".
            const isCurrentMonth =
              view === 'week' || isSameMonth(day, startOfMonth(currentDate))

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
                    {format(day, 'd')}
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
