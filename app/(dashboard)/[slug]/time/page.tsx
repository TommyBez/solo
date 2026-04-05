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
import { OutOfOfficeDayDialog } from '@/components/time/out-of-office-day-dialog'
import { ScheduleNextWeekDialog } from '@/components/time/schedule-next-week-dialog'
import { TimeEntriesList } from '@/components/time/time-entries-list'
import { TimerWidget } from '@/components/time/timer-widget'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getAiFeatureAvailability,
  getEffectiveAiSettings,
} from '@/lib/ai/access'
import { getActiveOrganizationSlug, getSession } from '@/lib/auth/session'
import { getAreas } from '@/lib/queries/areas'
import { getGitHubStatus } from '@/lib/queries/github'
import {
  getGoogleCalendarEventsForDateRange,
  getGoogleCalendarStatus,
} from '@/lib/queries/google-calendar'
import { getProjects } from '@/lib/queries/projects'
import { getOutOfOfficeDateKeysForDateRange } from '@/lib/queries/out-of-office'
import { defaultSettings, getSettings } from '@/lib/queries/settings'
import { getTimeEntriesForDateRange } from '@/lib/queries/time-entries'
import { getDateKey } from '@/lib/out-of-office'

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
  const [settings, aiFeatureAvailability] = session?.user
    ? await Promise.all([
        getSettings(session.user.id),
        getAiFeatureAvailability(),
      ])
    : [defaultSettings, { allowed: false }]
  const effectiveSettings = getEffectiveAiSettings(
    settings,
    aiFeatureAvailability.allowed,
  )
  const aiEnabled = effectiveSettings.aiEnabled
  const weekStartsOn = effectiveSettings.weekStartsOn === '0' ? 0 : 1

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
    outOfOfficeDateKeys,
  ] = await Promise.all([
    getTimeEntriesForDateRange(startDate, endDate),
    getProjects(),
    getGoogleCalendarStatus(),
    getGoogleCalendarEventsForDateRange(startDate, endDate),
    getActiveOrganizationSlug(),
    getAreas(),
    getGitHubStatus(),
    getOutOfOfficeDateKeysForDateRange(startDate, endDate),
  ])

  const activeProjects = projects.filter((p) => p.status === 'active')
  const currentDateKey = getDateKey(currentDate)
  const currentDateEntries = entries.filter(
    (entry) => getDateKey(entry.startTime) === currentDateKey,
  )
  const currentDateIsOutOfOffice = outOfOfficeDateKeys.includes(currentDateKey)

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
      {aiEnabled && (
        <WeeklyAuditBanner
          areasWithExpectedHours={areasWithExpectedHours}
          outOfOfficeDateKeys={outOfOfficeDateKeys}
          weekCalendarEvents={googleCalendarEvents}
          weekEntries={entries}
          weekStartsOn={weekStartsOn as 0 | 1}
        />
      )}

      {/* GitHub AI Suggestions Strip */}
      {aiEnabled && (
        <GitHubSuggestionsStrip
          githubConnected={githubStatus.connected}
          projects={activeProjects}
        />
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {viewParam === 'week' ? (
          <ScheduleNextWeekDialog
            projects={activeProjects}
            referenceDateIso={currentDate.toISOString()}
          />
        ) : null}
        <OutOfOfficeDayDialog
          date={currentDate}
          entryCount={currentDateEntries.length}
          isOutOfOffice={currentDateIsOutOfOffice}
        />
        <AddTimeEntryDialog projects={activeProjects} />
      </div>

      <CalendarView
        currentDate={currentDate}
        entries={entries}
        googleEvents={googleCalendarEvents}
        organizationSlug={slug ?? ''}
        outOfOfficeDateKeys={outOfOfficeDateKeys}
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
            <TimerWidget aiEnabled={aiEnabled} projects={activeProjects} />
          </div>
          <div className="lg:col-span-2" data-catchup-module>
            <TimeEntriesList
              entries={entries}
              outOfOfficeDateKeys={outOfOfficeDateKeys}
              projects={activeProjects}
            />
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
