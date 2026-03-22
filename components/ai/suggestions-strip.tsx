'use client'

import { useState, useMemo } from 'react'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/types'
import type { Area, Project, TimeEntry } from '@/lib/db/schema'
import { generateSuggestionHash, timeRangesOverlap } from '@/lib/ai/utils'
import { EntrySuggestionCard } from './entry-suggestion-card'

interface SuggestionsStripProps {
  entries: TimeEntry[]
  calendarEvents: GoogleCalendarEvent[]
  projects: (Project & { area: Area })[]
  dismissedHashes: string[]
}

// Find calendar events that don't have matching time entries
function findUntrackedEvents(
  calendarEvents: GoogleCalendarEvent[],
  entries: TimeEntry[],
  dismissedHashes: string[]
): GoogleCalendarEvent[] {
  const dismissedSet = new Set(dismissedHashes)

  return calendarEvents.filter((event) => {
    // Skip all-day events
    if (event.allDay) return false

    // Calculate event duration
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / 60000

    // Skip very short events (< 15 minutes)
    if (durationMinutes < 15) return false

    // Check if dismissed
    const hash = generateSuggestionHash({
      type: 'missing_entry',
      sourceId: event.id,
      date: event.startTime.split('T')[0],
    })
    if (dismissedSet.has(hash)) return false

    // Check if any time entry overlaps with this event
    const hasOverlap = entries.some((entry) => {
      const entryStart = new Date(entry.startTime)
      const entryEnd = entry.endTime
        ? new Date(entry.endTime)
        : new Date(entryStart.getTime() + entry.durationMinutes * 60000)

      return timeRangesOverlap(eventStart, eventEnd, entryStart, entryEnd)
    })

    return !hasOverlap
  })
}

export function SuggestionsStrip({
  entries,
  calendarEvents,
  projects,
  dismissedHashes,
}: SuggestionsStripProps) {
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(new Set())

  const untrackedEvents = useMemo(() => {
    const allDismissed = [...dismissedHashes, ...localDismissed]
    return findUntrackedEvents(calendarEvents, entries, allDismissed).slice(0, 5)
  }, [calendarEvents, entries, dismissedHashes, localDismissed])

  // Don't render if no suggestions
  if (untrackedEvents.length === 0) {
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
    // Remove from local list after accept using same hash format
    const hash = generateSuggestionHash({
      type: 'missing_entry',
      sourceId: event.id,
      date: event.startTime.split('T')[0],
    })
    setLocalDismissed((prev) => new Set([...prev, hash]))
  }

  return (
    <div className="relative mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Suggested time entries
        </h3>
        <span className="text-xs text-muted-foreground">
          {untrackedEvents.length} untracked event{untrackedEvents.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
        {untrackedEvents.map((event) => (
          <EntrySuggestionCard
            key={event.id}
            calendarEvent={event}
            projects={projects}
            onAccept={() => handleAccept(event)}
            onDismiss={() => handleDismiss(event)}
          />
        ))}
      </div>
    </div>
  )
}
