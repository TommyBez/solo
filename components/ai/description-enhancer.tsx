'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { updateTimeEntry } from '@/lib/actions/time-entries'
import {
  enhanceDescription,
  dismissSuggestion,
  generateSuggestionHash,
} from '@/lib/ai/time-capture'
import type { DescriptionEnhancement, SuggestionStatus } from '@/lib/ai/schemas'
import { SuggestionCard } from './suggestion-card'

interface DescriptionEnhancerProps {
  entryId: number
  projectId: number
  projectName: string
  areaName: string
  currentDescription: string
  durationMinutes: number
  onAccept: () => void
  onDismiss: () => void
  onEdit: (suggestedDescription: string) => void
}

export function DescriptionEnhancer({
  entryId,
  projectId,
  projectName,
  areaName,
  currentDescription,
  durationMinutes,
  onAccept,
  onDismiss,
  onEdit,
}: DescriptionEnhancerProps) {
  const [status, setStatus] = useState<SuggestionStatus>('loading')
  const [enhancement, setEnhancement] = useState<DescriptionEnhancement | null>(null)

  useEffect(() => {
    async function fetchEnhancement() {
      setStatus('loading')
      const result = await enhanceDescription({
        currentDescription,
        projectId,
        projectName,
        areaName,
        durationMinutes,
      })

      if (result) {
        setEnhancement(result)
        setStatus('default')
      } else {
        setStatus('error')
      }
    }

    fetchEnhancement()
  }, [currentDescription, projectId, projectName, areaName, durationMinutes])

  async function handleAccept() {
    if (!enhancement) return

    setStatus('accepting')
    try {
      await updateTimeEntry(entryId, {
        description: enhancement.enhancedDescription,
      })
      toast.success('Description updated')
      onAccept()
    } catch {
      toast.error('Failed to update description')
      setStatus('default')
    }
  }

  function handleEdit() {
    if (enhancement) {
      onEdit(enhancement.enhancedDescription)
    }
  }

  async function handleDismiss() {
    const hash = generateSuggestionHash({
      type: 'description_enhancement',
      sourceId: entryId.toString(),
      date: new Date().toISOString().split('T')[0],
    })

    await dismissSuggestion({
      suggestionType: 'description_enhancement',
      suggestionHash: hash,
    })

    onDismiss()
  }

  function handleRetry() {
    setStatus('loading')
    enhanceDescription({
      currentDescription,
      projectId,
      projectName,
      areaName,
      durationMinutes,
    }).then((result) => {
      if (result) {
        setEnhancement(result)
        setStatus('default')
      } else {
        setStatus('error')
      }
    })
  }

  // Determine evidence based on reasoning
  const evidenceLines = enhancement
    ? [
        {
          icon: 'history' as const,
          text: enhancement.reasoning,
        },
      ]
    : []

  return (
    <div className="mt-4">
      <SuggestionCard
        type="description"
        status={status}
        enhancedDescription={enhancement?.enhancedDescription}
        evidenceLines={evidenceLines}
        onAccept={handleAccept}
        onEdit={handleEdit}
        onDismiss={handleDismiss}
        onRetry={handleRetry}
        className="w-full max-w-none"
      />
    </div>
  )
}
