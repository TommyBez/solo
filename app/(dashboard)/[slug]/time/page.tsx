import {
  endOfMonth,
  endOfWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { FolderKanban } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { GitHubSuggestionsStrip } from '@/components/ai/github-suggestions-strip'
import { WeeklyAuditBanner } from '@/components/ai/weekly-audit-banner'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { AddTimeEntryDialog } from '@/components/time/add-time-entry-dialog'
import { CalendarView } from '@/components/time/calendar-view'
import { GoogleCalendarBanner } from '@/components/time/google-calendar-banner'
import { ScheduleNextWeekDialog } from '@/components/time/schedule-next-week-dialog'
import { TimeEntriesList } from '@/components/time/time-entries-list'
import { TimerWidget } from '@/components/time/timer-widget'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getActiveOrganizationSlug, getSession } from '@/lib/auth/session'
import { getAreas } from '@/lib/queries/areas'
import { getGitHubStatus } from '@/lib/queries/github'
import {
  getGoogleCalendarEventsForDateRange,
  getGoogleCalendarStatus,
} from '@/lib/queries/google-calendar'
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
    typeof searchParams.view === 'string' ? searchParams.view : 'week'
  return (
    <div className="space-y-6">
      <PageHeader
        description="Track your work hours and manage time entries"
        title="Time Tracking"
      />

      <Suspense fallback={<TimeTrackingSkeleton />}>
        <TimeTrackingContent dateParam={dateParam} viewParam={viewParam} />
      </Suspense>
    </div>
  )
}

async function TimeTrackingContent({
  dateParam,
  viewParam,
}: {
  dateParam?: string
  viewParam: string
}) {
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

  const [
    entries,
    projects,
    googleCalendarStatus,
    googleCalendarEvents,
    slug,
    areas,
    githubStatus,
  ] = await Promise.all([
    getTimeEntriesForDateRange(startDate, endDate),
    getProjects(),
    getGoogleCalendarStatus(),
    getGoogleCalendarEventsForDateRange(startDate, endDate),
    getActiveOrganizationSlug(),
    getAreas(),
    getGitHubStatus(),
  ])

  const activeProjects = projects.filter((p) => p.status === 'active')

  // Prepare areas data for weekly audit
  const areasWithExpectedHours = areas.map((area) => ({
    id: area.id,
    name: area.name,
    expectedHoursPerWeek: area.expectedHoursPerWeek,
    color: area.color,
  }))

  return (
    <>
      {googleCalendarStatus.connected ? null : <GoogleCalendarBanner />}

      {/* Weekly Audit Banner - shows on Friday/Sunday */}
      {settings.aiEnabled && (
        <WeeklyAuditBanner
          areasWithExpectedHours={areasWithExpectedHours}
          weekCalendarEvents={googleCalendarEvents}
          weekEntries={entries}
          weekStartsOn={weekStartsOn as 0 | 1}
        />
      )}

      {/* GitHub AI Suggestions Strip */}
      {settings.aiEnabled && (
        <GitHubSuggestionsStrip
          githubConnected={githubStatus.connected}
          projects={activeProjects.map((p) => ({ id: p.id, name: p.name }))}
        />
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {viewParam === 'week' ? (
          <ScheduleNextWeekDialog
            projects={activeProjects}
            referenceDateIso={currentDate.toISOString()}
          />
        ) : null}
        <AddTimeEntryDialog projects={activeProjects} />
      </div>

      <CalendarView
        currentDate={currentDate}
        entries={entries}
        googleEvents={googleCalendarEvents}
        organizationSlug={slug ?? ''}
        projects={activeProjects}
        view={viewParam as 'month' | 'week'}
      />

      {projects.length === 0 ? (
        <EmptyState
          action={
            <Button asChild>
              <Link href={`/${slug}/projects`}>Go to Projects</Link>
            </Button>
          }
          description="You need to create a project before tracking time"
          icon={FolderKanban}
          title="Create a project first"
        />
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="order-first lg:order-none lg:col-span-1">
            <TimerWidget
              aiEnabled={settings.aiEnabled}
              projects={activeProjects}
            />
          </div>
          <div className="lg:col-span-2" data-catchup-module>
            <TimeEntriesList entries={entries} projects={activeProjects} />
          </div>
        </div>
      )}
    </>
  )
}

function TimeTrackingSkeleton() {
  return (
    <>
      <div className="flex items-center justify-end">
        <Skeleton className="h-9 w-24 sm:h-10 sm:w-28" />
      </div>
      <Skeleton className="h-48 sm:h-64" />
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Skeleton className="h-48 sm:h-64 lg:col-span-1" />
        <Skeleton className="h-64 sm:h-96 lg:col-span-2" />
      </div>
    </>
  )
}
