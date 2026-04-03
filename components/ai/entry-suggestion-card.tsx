'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createTimeEntry } from '@/lib/actions/time-entries'
import type { EntrySuggestion, SuggestionStatus } from '@/lib/ai/schemas'
import { dismissSuggestion, suggestEntryFromEvent } from '@/lib/ai/time-capture'
import { generateSuggestionHash } from '@/lib/ai/utils'
import type { Area, Project } from '@/lib/db/schema'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/types'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { TimeEntryForm } from '@/components/time/time-entry-form'
import { SuggestionCard } from './suggestion-card'

interface EntrySuggestionCardProps {
  calendarEvent: GoogleCalendarEvent
  onAccept: () => void
  onDismiss: () => void
  projects: (Project & { area: Area })[]
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
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchSuggestion() {
      setStatus('loading')
      const result = await suggestEntryFromEvent({ calendarEvent })

      if (!isMounted) {
        return
      }

      if (result) {
        setSuggestion(result)
        setStatus('default')
      } else {
        setStatus('error')
      }
    }

    fetchSuggestion()

    return () => {
      isMounted = false
    }
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
    if (!(suggestion && selectedProject)) {
      return
    }

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
    setEditOpen(true)
  }

  function handleEditSuccess() {
    setEditOpen(false)
    onAccept()
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

  async function handleRetry() {
    setStatus('loading')
    try {
      const result = await suggestEntryFromEvent({ calendarEvent })
      if (result) {
        setSuggestion(result)
        setStatus('default')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
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
    <>
      <SuggestionCard
        areaName={selectedProject?.area.name}
        description={suggestion?.description || calendarEvent.title}
        duration={suggestion?.durationMinutes}
        evidenceLines={evidenceLines}
        onAccept={handleAccept}
        onDismiss={handleDismiss}
        onEdit={handleEdit}
        onRetry={handleRetry}
        projectColor={selectedProject?.area.color}
        projectName={selectedProject?.name || calendarEvent.title}
        status={status}
        timeWindow={timeWindow}
        type="entry"
      />

      <ResponsiveDialog
        description="Review and modify all fields before logging."
        onOpenChange={setEditOpen}
        open={editOpen}
        title="Edit &amp; Accept Entry"
      >
        <TimeEntryForm
          initialValues={{
            projectId: suggestion?.projectId?.toString(),
            description: suggestion?.description,
            date: calendarEvent.startTime,
            durationMinutes: suggestion?.durationMinutes,
          }}
          onSuccess={handleEditSuccess}
          projects={projects}
        />
      </ResponsiveDialog>
    </>
  )
}
