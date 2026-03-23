'use client'

import { getDay } from 'date-fns'
import { ChevronRight, ClipboardCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { isDescriptionVague } from '@/lib/ai/prompts'
import { timeRangesOverlap } from '@/lib/ai/utils'
import type { TimeEntry } from '@/lib/db/schema'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/types'

interface WeeklyAuditBannerProps {
  areasWithExpectedHours: Array<{
    id: number
    name: string
    expectedHoursPerWeek: number
    color: string
  }>
  weekCalendarEvents: GoogleCalendarEvent[]
  weekEntries: TimeEntry[]
  weekStartsOn?: 0 | 1
}

// Count untracked calendar events
function countUntrackedEvents(
  calendarEvents: GoogleCalendarEvent[],
  entries: TimeEntry[],
): number {
  return calendarEvents.filter((event) => {
    if (event.allDay) {
      return false
    }

    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / 60_000

    if (durationMinutes < 15) {
      return false
    }

    const hasOverlap = entries.some((entry) => {
      const entryStart = new Date(entry.startTime)
      const entryEnd = entry.endTime
        ? new Date(entry.endTime)
        : new Date(entryStart.getTime() + entry.durationMinutes * 60_000)

      return timeRangesOverlap(eventStart, eventEnd, entryStart, entryEnd)
    })

    return !hasOverlap
  }).length
}

// Count entries with vague descriptions
function countVagueDescriptions(entries: TimeEntry[]): number {
  return entries.filter((entry) => isDescriptionVague(entry.description)).length
}

// Check if it's a weekly review time (Friday 2PM+ or all day Sunday)
function isWeeklyReviewTime(): boolean {
  const now = new Date()
  const dayOfWeek = getDay(now)
  const hour = now.getHours()

  // Friday after 2 PM
  if (dayOfWeek === 5 && hour >= 14) {
    return true
  }

  // Sunday all day
  if (dayOfWeek === 0) {
    return true
  }

  return false
}

interface GapInfo {
  underTrackedAreas: Array<{
    name: string
    color: string
    expected: number
    actual: number
  }>
  untrackedEvents: number
  vagueDescriptions: number
}

export function WeeklyAuditBanner({
  weekEntries,
  weekCalendarEvents,
  areasWithExpectedHours: _areasWithExpectedHours,
  weekStartsOn: _weekStartsOn = 1,
}: WeeklyAuditBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  const gapInfo = useMemo((): GapInfo => {
    const untrackedEvents = countUntrackedEvents(
      weekCalendarEvents,
      weekEntries,
    )
    const vagueDescriptions = countVagueDescriptions(weekEntries)

    // TODO: Implement area tracking when project->area mapping is available in entries
    const underTrackedAreas: GapInfo['underTrackedAreas'] = []

    return { untrackedEvents, vagueDescriptions, underTrackedAreas }
  }, [weekCalendarEvents, weekEntries])

  // Don't show if dismissed or not review time or no issues
  if (isDismissed) {
    return null
  }
  if (!isWeeklyReviewTime()) {
    return null
  }

  const totalIssues =
    gapInfo.untrackedEvents +
    gapInfo.vagueDescriptions +
    gapInfo.underTrackedAreas.length

  if (totalIssues === 0) {
    return null
  }

  // Build summary message
  const messageParts: string[] = []
  if (gapInfo.untrackedEvents > 0) {
    messageParts.push(
      `${gapInfo.untrackedEvents} potential gap${gapInfo.untrackedEvents !== 1 ? 's' : ''}`,
    )
  }
  if (gapInfo.vagueDescriptions > 0) {
    messageParts.push(
      `${gapInfo.vagueDescriptions} vague description${gapInfo.vagueDescriptions !== 1 ? 's' : ''}`,
    )
  }
  if (gapInfo.underTrackedAreas.length > 0) {
    messageParts.push(
      `${gapInfo.underTrackedAreas.length} under-tracked area${gapInfo.underTrackedAreas.length !== 1 ? 's' : ''}`,
    )
  }

  const message = messageParts.join(', ')

  function handleReview() {
    // Scroll to daily catchup module if it exists
    const catchupModule = document.querySelector('[data-catchup-module]')
    if (catchupModule) {
      catchupModule.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-500/50 bg-amber-50 p-4 dark:bg-amber-950/20">
      <div className="flex items-center gap-3">
        <ClipboardCheck
          aria-hidden="true"
          className="size-5 text-amber-600 dark:text-amber-400"
        />
        <div>
          <p className="font-medium text-sm">Weekly Review: {message}</p>
          <p className="text-muted-foreground text-xs">
            Review your time entries before the week ends
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => setIsDismissed(true)} size="sm" variant="ghost">
          Dismiss
        </Button>
        <Button onClick={handleReview} size="sm">
          Review
          <ChevronRight aria-hidden="true" className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  )
}
