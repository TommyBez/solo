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
import { CalendarClock, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ColorDot } from '@/components/color-indicator'
import { AddTimeEntryDialog } from '@/components/time/add-time-entry-dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettingsContext } from '@/lib/context/settings-context'
import type { Area, Project, TimeEntry } from '@/lib/db/schema'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/types'
import { cn } from '@/lib/utils'

type TimeEntryWithDetails = TimeEntry & {
  project: Project & {
    area: Area
  }
}

interface CalendarViewProps {
  currentDate: Date
  entries: TimeEntryWithDetails[]
  googleEvents: GoogleCalendarEvent[]
  organizationSlug: string
  projects: (Project & { area: Area })[]
  view: 'month' | 'week'
}

function getEventDurationMinutes(event: GoogleCalendarEvent) {
  if (event.allDay) {
    return 60
  }

  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  return diff > 0 ? diff : 60
}

function getEventDescription(event: GoogleCalendarEvent) {
  return event.description?.trim()
    ? `${event.title}\n${event.description.trim()}`
    : event.title
}

const googleEventTriggerClassName =
  'group flex cursor-pointer items-start gap-1 rounded border border-blue-200/80 bg-blue-50/60 p-0.5 text-left text-[9px] active:opacity-70 sm:cursor-default sm:p-1 sm:text-[11px] dark:border-blue-500/40 dark:bg-blue-500/10 overflow-hidden'

function GoogleCalendarEventRow({
  event,
  projects,
  formatTime,
}: {
  event: GoogleCalendarEvent
  formatTime: (date: Date | string) => string
  projects: (Project & { area: Area })[]
}) {
  const eventStart = new Date(event.startTime)
  const eventEnd = new Date(event.endTime)

  const eventContent = (
    <>
      <CalendarClock className="mt-0.5 hidden size-3 shrink-0 text-blue-700 sm:block dark:text-blue-300" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{event.title}</p>
        <p className="hidden truncate text-blue-700/80 sm:block dark:text-blue-300/80">
          {event.allDay
            ? 'All day'
            : `${formatTime(eventStart)} - ${formatTime(eventEnd)}`}
        </p>
      </div>
      <Plus className="size-3 shrink-0 text-blue-700/80 opacity-0 transition-opacity group-hover:opacity-100 sm:hidden dark:text-blue-300/80" />
      {projects.length > 0 ? (
        <Button
          className="hidden h-5 w-5 p-0 text-blue-700/80 hover:text-blue-900 sm:flex dark:text-blue-300/80 dark:hover:text-blue-100"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Plus className="size-3" />
        </Button>
      ) : null}
    </>
  )

  if (projects.length > 0) {
    return (
      <AddTimeEntryDialog
        buttonLabel="Create Entry"
        description="Prefilled from your Google Calendar event."
        initialValues={{
          date: event.startTime,
          description: getEventDescription(event),
          durationMinutes: getEventDurationMinutes(event),
        }}
        projects={projects}
        title="Create entry from event"
        trigger={
          <button
            className={googleEventTriggerClassName}
            title={event.title}
            type="button"
          >
            {eventContent}
          </button>
        }
      />
    )
  }

  return (
    <div
      className="group flex items-start gap-1 rounded border border-blue-200/80 bg-blue-50/60 p-0.5 text-[9px] sm:p-1 sm:text-[11px] dark:border-blue-500/40 dark:bg-blue-500/10 overflow-hidden"
      title={event.title}
    >
      {eventContent}
    </div>
  )
}

function CalendarDayCell({
  currentDate,
  day,
  dayIdx,
  days,
  entries,
  formatTime,
  googleEvents,
  projects,
  view,
}: {
  currentDate: Date
  day: Date
  dayIdx: number
  days: Date[]
  entries: TimeEntryWithDetails[]
  formatTime: (date: Date | string) => string
  googleEvents: GoogleCalendarEvent[]
  projects: (Project & { area: Area })[]
  view: 'month' | 'week'
}) {
  const dayEntries = entries.filter((entry) =>
    isSameDay(new Date(entry.startTime), day),
  )
  const dayGoogleEvents = googleEvents.filter((event) =>
    isSameDay(new Date(event.startTime), day),
  )
  const isToday = isSameDay(day, new Date())
  const isCurrentMonth =
    view === 'week' || isSameMonth(day, startOfMonth(currentDate))
  const isLastRow = dayIdx >= days.length - 7
  const isLastCol = (dayIdx + 1) % 7 === 0
  const eventSlice = view === 'week' ? 5 : 2

  return (
    <div
      className={cn(
        'min-h-[80px] border-r border-b p-1 transition-colors hover:bg-muted/50 sm:min-h-[140px] sm:p-2',
        isCurrentMonth ? '' : 'bg-muted/10 text-muted-foreground',
        isToday && isCurrentMonth ? 'bg-primary/5 dark:bg-primary/10' : '',
        isLastRow ? 'border-b-0' : '',
        isLastCol ? 'border-r-0' : '',
      )}
    >
      <div className="mb-1 flex items-start justify-between sm:mb-2">
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded-full font-medium text-xs sm:size-7 sm:text-sm',
            isToday ? 'bg-primary text-primary-foreground' : '',
          )}
        >
          {format(day, 'd')}
        </span>
      </div>

      <div className="space-y-0.5 overflow-hidden sm:space-y-1">
        {dayGoogleEvents.slice(0, eventSlice).map((event) => (
          <GoogleCalendarEventRow
            event={event}
            formatTime={formatTime}
            key={`google-event-${event.id}`}
            projects={projects}
          />
        ))}
        {dayGoogleEvents.length > eventSlice && (
          <p className="text-[9px] text-muted-foreground sm:text-[10px]">
            +{dayGoogleEvents.length - eventSlice} more
          </p>
        )}
        {dayEntries.slice(0, eventSlice).map((entry) => (
          <div
            className="flex items-center gap-0.5 truncate rounded bg-muted p-0.5 text-[9px] sm:gap-1 sm:p-1 sm:text-xs overflow-hidden"
            key={entry.id}
            title={`${entry.project.name}: ${entry.description}`}
          >
            <ColorDot className="size-1.5 shrink-0" color={entry.project.area.color} />
            <span className="truncate font-medium">{entry.project.name}</span>
            <span className="hidden shrink-0 font-mono tabular-nums opacity-70 sm:inline">
              ({Math.round((entry.durationMinutes / 60) * 10) / 10}h)
            </span>
          </div>
        ))}
        {dayEntries.length > eventSlice && (
          <p className="text-[9px] text-muted-foreground sm:text-[10px]">
            +{dayEntries.length - eventSlice} more
          </p>
        )}
      </div>
    </div>
  )
}

export function CalendarView({
  entries,
  currentDate,
  googleEvents,
  organizationSlug,
  projects,
  view,
}: CalendarViewProps) {
  const router = useRouter()
  const { settings, formatDate, formatTime } = useSettingsContext()
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
    router.push(`/${organizationSlug}/time?${params.toString()}`)
  }

  const handleViewChange = (newView: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set('view', newView)
    router.push(`/${organizationSlug}/time?${params.toString()}`)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold font-mono text-2xl tabular-nums sm:text-4xl">
            {totalHours}h
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Total time this {view === 'week' ? 'week' : 'month'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Tabs onValueChange={handleViewChange} value={view}>
            <TabsList className="h-9">
              <TabsTrigger className="text-xs sm:text-sm" value="month">
                Month
              </TabsTrigger>
              <TabsTrigger className="text-xs sm:text-sm" value="week">
                Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              className="size-8 sm:size-9"
              onClick={() => navigateDate('prev')}
              size="icon"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[100px] text-center font-medium text-sm sm:min-w-[160px] sm:text-base">
              {headerTitle}
            </span>
            <Button
              className="size-8 sm:size-9"
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
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[600px] overflow-hidden rounded-lg border bg-background sm:min-w-0">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {weekDays.map((day) => (
              <div
                className="border-r p-1.5 text-center font-medium text-[10px] text-muted-foreground uppercase last:border-r-0 sm:p-2 sm:text-xs"
                key={day}
              >
                <span className="sm:hidden">{day.charAt(0)}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid auto-rows-fr grid-cols-7">
            {days.map((day, dayIdx) => (
              <CalendarDayCell
                currentDate={currentDate}
                day={day}
                dayIdx={dayIdx}
                days={days}
                entries={entries}
                formatTime={formatTime}
                googleEvents={googleEvents}
                key={day.toString()}
                projects={projects}
                view={view}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
