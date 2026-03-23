'use client'

import { endOfDay, isAfter, startOfDay } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createTimeEntry } from '@/lib/actions/time-entries'
import { isDescriptionVague } from '@/lib/ai/prompts'
import { suggestEntryFromEvent } from '@/lib/ai/time-capture'
import { generateSuggestionHash, timeRangesOverlap } from '@/lib/ai/utils'
import type { Area, Project, TimeEntry } from '@/lib/db/schema'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/types'
import { AiDraftBadge } from './ai-draft-badge'
import { BatchActionBar } from './batch-action-bar'
import { EntrySuggestionCard } from './entry-suggestion-card'
import { EvidenceChip } from './evidence-chip'

interface DailyCatchupModuleProps {
  dismissedHashes: string[]
  projects: (Project & { area: Area })[]
  todayCalendarEvents: GoogleCalendarEvent[]
  todayEntries: TimeEntry[]
}

// Find untracked events for today
function findUntrackedEventsForToday(
  calendarEvents: GoogleCalendarEvent[],
  entries: TimeEntry[],
  dismissedHashes: string[],
): GoogleCalendarEvent[] {
  const dismissedSet = new Set(dismissedHashes)
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  return calendarEvents.filter((event) => {
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)

    // Only include today's events
    if (eventStart < todayStart || eventStart > todayEnd) {
      return false
    }

    // Skip all-day events
    if (event.allDay) {
      return false
    }

    // Skip future events (not yet happened)
    if (isAfter(eventStart, now)) {
      return false
    }

    // Calculate event duration
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / 60_000

    // Skip very short events (< 15 minutes)
    if (durationMinutes < 15) {
      return false
    }

    // Check if dismissed
    const hash = generateSuggestionHash({
      type: 'missing_entry',
      sourceId: event.id,
      date: event.startTime.split('T')[0],
    })
    if (dismissedSet.has(hash)) {
      return false
    }

    // Check if any time entry overlaps with this event
    const hasOverlap = entries.some((entry) => {
      const entryStart = new Date(entry.startTime)
      const entryEnd = entry.endTime
        ? new Date(entry.endTime)
        : new Date(entryStart.getTime() + entry.durationMinutes * 60_000)

      return timeRangesOverlap(eventStart, eventEnd, entryStart, entryEnd)
    })

    return !hasOverlap
  })
}

// Find entries with vague descriptions from today
function findVagueDescriptionEntries(entries: TimeEntry[]): TimeEntry[] {
  const now = new Date()
  const todayStart = startOfDay(now)

  return entries.filter((entry) => {
    const entryDate = new Date(entry.startTime)
    if (entryDate < todayStart) {
      return false
    }
    return isDescriptionVague(entry.description)
  })
}

// Check if it's after 5 PM
function isAfterWorkHours(): boolean {
  const now = new Date()
  return now.getHours() >= 17
}

export function DailyCatchupModule({
  todayEntries,
  todayCalendarEvents,
  projects,
  dismissedHashes,
}: DailyCatchupModuleProps) {
  const router = useRouter()
  const [isHidden, setIsHidden] = useState(false)
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(new Set())

  const untrackedEvents = useMemo(() => {
    const allDismissed = [...dismissedHashes, ...localDismissed]
    return findUntrackedEventsForToday(
      todayCalendarEvents,
      todayEntries,
      allDismissed,
    ).slice(0, 5)
  }, [todayCalendarEvents, todayEntries, dismissedHashes, localDismissed])

  const vagueEntries = useMemo(
    () => findVagueDescriptionEntries(todayEntries),
    [todayEntries],
  )

  // Don't show if hidden, no suggestions, or not after work hours with entries
  const shouldShow =
    !isHidden &&
    (untrackedEvents.length > 0 || vagueEntries.length > 0) &&
    (isAfterWorkHours() || todayEntries.length === 0)

  if (!shouldShow) {
    return null
  }

  function handleDismiss(event: GoogleCalendarEvent) {
    const hash = generateSuggestionHash({
      type: 'missing_entry',
      sourceId: event.id,
      date: event.startTime.split('T')[0],
    })
    setLocalDismissed((prev) => new Set([...prev, hash]))
  }

  function handleAccept(event: GoogleCalendarEvent) {
    const hash = generateSuggestionHash({
      type: 'missing_entry',
      sourceId: event.id,
      date: event.startTime.split('T')[0],
    })
    setLocalDismissed((prev) => new Set([...prev, hash]))
  }

  async function handleAcceptAll() {
    // Accept all untracked events
    const results = await Promise.all(
      untrackedEvents.map(async (event) => {
        try {
          const suggestion = await suggestEntryFromEvent({
            calendarEvent: event,
          })
          if (suggestion) {
            // Use calendar event times as source of truth and derive duration
            const eventStart = new Date(event.startTime)
            const eventEnd = new Date(event.endTime)
            const derivedDurationMinutes = Math.round(
              (eventEnd.getTime() - eventStart.getTime()) / 60_000,
            )
            await createTimeEntry({
              projectId: suggestion.projectId,
              description: suggestion.description,
              startTime: eventStart,
              endTime: eventEnd,
              durationMinutes: derivedDurationMinutes,
            })
            return true
          }
          return false
        } catch {
          return false
        }
      }),
    )

    const successCount = results.filter(Boolean).length
    if (successCount > 0) {
      toast.success(
        `Created ${successCount} time ${successCount === 1 ? 'entry' : 'entries'}`,
      )
      router.refresh()
      setIsHidden(true)
    } else {
      toast.error(
        'Failed to create time entries. Please try adding them manually.',
      )
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">End-of-day review</CardTitle>
            <AiDraftBadge />
          </div>
          <BatchActionBar
            count={untrackedEvents.length}
            onAcceptAll={handleAcceptAll}
            onHide={() => setIsHidden(true)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {untrackedEvents.length > 0 && (
          <div>
            <h4 className="mb-2 font-medium text-muted-foreground text-sm">
              Missing entries ({untrackedEvents.length})
            </h4>
            <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted flex gap-3 overflow-x-auto pb-2">
              {untrackedEvents.map((event) => (
                <EntrySuggestionCard
                  calendarEvent={event}
                  key={event.id}
                  onAccept={() => handleAccept(event)}
                  onDismiss={() => handleDismiss(event)}
                  projects={projects}
                />
              ))}
            </div>
          </div>
        )}

        {vagueEntries.length > 0 && (
          <div>
            <h4 className="mb-2 font-medium text-muted-foreground text-sm">
              Entries that could use more detail ({vagueEntries.length})
            </h4>
            <div className="space-y-2">
              {vagueEntries.slice(0, 3).map((entry) => {
                const project = projects.find((p) => p.id === entry.projectId)
                return (
                  <div
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                    key={entry.id}
                  >
                    <div className="flex items-center gap-3">
                      {project && (
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: project.area.color }}
                        />
                      )}
                      <div>
                        <p className="font-medium text-sm">{project?.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {entry.description || '(no description)'}
                        </p>
                      </div>
                    </div>
                    <EvidenceChip icon="history" text="Needs detail" />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
