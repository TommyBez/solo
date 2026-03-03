import {
  endOfMonth,
  endOfWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import Link from 'next/link'
import { AddTimeEntryDialog } from '@/components/time/add-time-entry-dialog'
import { CalendarView } from '@/components/time/calendar-view'
import { ScheduleNextWeekDialog } from '@/components/time/schedule-next-week-dialog'
import { TimeEntriesList } from '@/components/time/time-entries-list'
import { TimerWidget } from '@/components/time/timer-widget'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/auth/session'
import { getProjects } from '@/lib/queries/projects'
import { defaultSettings, getSettings } from '@/lib/queries/settings'
import { getTimeEntriesForDateRange } from '@/lib/queries/time-entries'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function TimeTrackingPage(props: {
  searchParams: SearchParams
}) {
  const searchParams = await props.searchParams
  const dateParam =
    typeof searchParams.date === 'string' ? searchParams.date : undefined
  const viewParam =
    typeof searchParams.view === 'string' ? searchParams.view : 'month'
  const currentDate = dateParam ? parseISO(dateParam) : new Date()

  // Fetch user settings for week start preference
  const session = await getSession()
  const settings = session?.user
    ? await getSettings(session.user.id)
    : defaultSettings
  const weekStartsOn = settings.weekStartsOn === '0' ? 0 : 1

  // Calculate range for the calendar view
  let startDate: Date
  let endDate: Date

  if (viewParam === 'week') {
    startDate = startOfWeek(currentDate, { weekStartsOn })
    endDate = endOfWeek(currentDate, { weekStartsOn })
  } else {
    // Month view - include padding days
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    startDate = startOfWeek(monthStart, { weekStartsOn })
    endDate = endOfWeek(monthEnd, { weekStartsOn })
  }

  const [entries, projects] = await Promise.all([
    getTimeEntriesForDateRange(startDate, endDate),
    getProjects(),
  ])

  const activeProjects = projects.filter((p) => p.status === 'active')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track your work hours and manage time entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          {viewParam === 'week' ? (
            <ScheduleNextWeekDialog
              projects={activeProjects}
              referenceDateIso={currentDate.toISOString()}
            />
          ) : null}
          <AddTimeEntryDialog projects={activeProjects} />
        </div>
      </div>

      <CalendarView
        currentDate={currentDate}
        entries={entries}
        view={viewParam as 'month' | 'week'}
      />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="font-semibold text-lg">Create a project first</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            You need to create a project before tracking time
          </p>
          <Button asChild>
            <Link href="/projects">Go to Projects</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <TimerWidget projects={activeProjects} />
          </div>
          <div className="lg:col-span-2">
            <TimeEntriesList entries={entries} projects={activeProjects} />
          </div>
        </div>
      )}
    </div>
  )
}
