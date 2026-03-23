'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { updateTimeEntry } from '@/lib/actions/time-entries'
import type { DescriptionEnhancement, SuggestionStatus } from '@/lib/ai/schemas'
import { dismissSuggestion, enhanceDescription } from '@/lib/ai/time-capture'
import { generateSuggestionHash } from '@/lib/ai/utils'
import { SuggestionCard } from './suggestion-card'

interface DescriptionEnhancerProps {
  areaName: string
  currentDescription: string
  durationMinutes: number
  entryId: number
  onAccept: () => void
  onDismiss: () => void
  onEdit: (suggestedDescription: string) => void
  projectId: number
  projectName: string
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
  const [enhancement, setEnhancement] = useState<DescriptionEnhancement | null>(
    null,
  )

  useEffect(() => {
    let isMounted = true

    async function fetchEnhancement() {
      setStatus('loading')
      const result = await enhanceDescription({
        currentDescription,
        projectId,
        projectName,
        areaName,
        durationMinutes,
      })

      if (!isMounted) {
        return
      }

      if (result) {
        setEnhancement(result)
        setStatus('default')
      } else {
        setStatus('error')
      }
    }

    fetchEnhancement()

    return () => {
      isMounted = false
    }
  }, [currentDescription, projectId, projectName, areaName, durationMinutes])

  async function handleAccept() {
    if (!enhancement) {
      return
    }

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

    try {
      const result = await dismissSuggestion({
        suggestionType: 'description_enhancement',
        suggestionHash: hash,
      })

      if (result.success) {
        onDismiss()
      } else {
        console.error('Failed to dismiss suggestion')
      }
    } catch (error) {
      console.error('Error dismissing suggestion:', error)
    }
  }

  async function handleRetry() {
    setStatus('loading')
    try {
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
    } catch {
      setStatus('error')
    }
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
        className="w-full max-w-none"
        enhancedDescription={enhancement?.enhancedDescription}
        evidenceLines={evidenceLines}
        onAccept={handleAccept}
        onDismiss={handleDismiss}
        onEdit={handleEdit}
        onRetry={handleRetry}
        status={status}
        type="description"
      />
    </div>
  )
}
