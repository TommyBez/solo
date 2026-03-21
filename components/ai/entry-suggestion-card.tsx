'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createTimeEntry } from '@/lib/actions/time-entries'
import { suggestEntryFromEvent, dismissSuggestion } from '@/lib/ai/time-capture'
import { generateSuggestionHash } from '@/lib/ai/utils'
import type { EntrySuggestion, SuggestionStatus } from '@/lib/ai/schemas'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/types'
import type { Area, Project } from '@/lib/db/schema'
import { SuggestionCard } from './suggestion-card'

interface EntrySuggestionCardProps {
  calendarEvent: GoogleCalendarEvent
  projects: (Project & { area: Area })[]
  onAccept: () => void
  onDismiss: () => void
}

export function EntrySuggestionCard({
  calendarEvent,
  projects,
  onAccept,
  onDismiss,
}: EntrySuggestionCardProps) {
  const router = useRouter()
  const [status, setStatus] = useState<SuggestionStatus>('loading')
  const [suggestion, setSuggestion] = useState<EntrySuggestion | null>(null)

  useEffect(() => {
    async function fetchSuggestion() {
      setStatus('loading')
      const result = await suggestEntryFromEvent({ calendarEvent })

      if (result) {
        setSuggestion(result)
        setStatus('default')
      } else {
        setStatus('error')
      }
    }

    fetchSuggestion()
  }, [calendarEvent])

  const selectedProject = suggestion
    ? projects.find((p) => p.id === suggestion.projectId)
    : null

  // Calculate time window from calendar event
  const timeWindow = {
    start: new Date(calendarEvent.startTime),
    end: new Date(calendarEvent.endTime),
  }

  async function handleAccept() {
    if (!suggestion || !selectedProject) return

    setStatus('accepting')
    try {
      await createTimeEntry({
        projectId: suggestion.projectId,
        description: suggestion.description,
        startTime: new Date(calendarEvent.startTime),
        endTime: new Date(calendarEvent.endTime),
        durationMinutes: suggestion.durationMinutes,
      })
      toast.success('Time entry created')
      router.refresh()
      onAccept()
    } catch {
      toast.error('Failed to create time entry')
      setStatus('default')
    }
  }

  function handleEdit() {
    // For now, accept and let user edit in the list
    handleAccept()
  }

  async function handleDismiss() {
    const hash = generateSuggestionHash({
      type: 'missing_entry',
      sourceId: calendarEvent.id,
      date: calendarEvent.startTime.split('T')[0],
    })

    await dismissSuggestion({
      suggestionType: 'missing_entry',
      suggestionHash: hash,
      sourceEventId: calendarEvent.id,
    })

    onDismiss()
  }

  function handleRetry() {
    setStatus('loading')
    suggestEntryFromEvent({ calendarEvent }).then((result) => {
      if (result) {
        setSuggestion(result)
        setStatus('default')
      } else {
        setStatus('error')
      }
    })
  }

  // Determine evidence based on confidence and reasoning
  const evidenceLines = suggestion
    ? [
        {
          icon: 'calendar' as const,
          text: 'From your calendar',
        },
        ...(suggestion.confidence !== 'high'
          ? [
              {
                icon: 'history' as const,
                text: suggestion.reasoning,
              },
            ]
          : []),
      ]
    : []

  return (
    <SuggestionCard
      type="entry"
      status={status}
      projectName={selectedProject?.name || calendarEvent.title}
      projectColor={selectedProject?.area.color}
      areaName={selectedProject?.area.name}
      duration={suggestion?.durationMinutes}
      description={suggestion?.description || calendarEvent.title}
      timeWindow={timeWindow}
      evidenceLines={evidenceLines}
      onAccept={handleAccept}
      onEdit={handleEdit}
      onDismiss={handleDismiss}
      onRetry={handleRetry}
    />
  )
}
