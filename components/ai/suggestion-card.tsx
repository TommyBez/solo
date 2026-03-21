'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SuggestionStatus, EvidenceIcon } from '@/lib/ai/schemas'
import { AiDraftBadge } from './ai-draft-badge'
import { EvidenceChip } from './evidence-chip'
import { ActionRow } from './action-row'
import { LoadingSkeleton } from './loading-skeleton'
import { ErrorState } from './error-state'

interface SuggestionCardProps {
  type: 'entry' | 'description'
  status: SuggestionStatus

  // For entry suggestions
  projectName?: string
  projectColor?: string
  areaName?: string
  duration?: number
  description?: string
  timeWindow?: { start: Date; end: Date }

  // For description suggestions
  enhancedDescription?: string

  // Evidence
  evidenceLines: Array<{
    icon?: EvidenceIcon
    text: string
  }>

  // Actions
  onAccept: () => Promise<void>
  onEdit: () => void
  onDismiss: () => Promise<void>
  onRetry?: () => void

  className?: string
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function formatTimeWindow(start: Date, end: Date): string {
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${formatTime(start)} - ${formatTime(end)}`
}

export function SuggestionCard({
  type,
  status,
  projectName,
  projectColor,
  areaName,
  duration,
  description,
  timeWindow,
  enhancedDescription,
  evidenceLines,
  onAccept,
  onEdit,
  onDismiss,
  onRetry,
  className,
}: SuggestionCardProps) {
  const [isDismissing, setIsDismissing] = useState(false)

  if (status === 'loading') {
    return <LoadingSkeleton type="suggestion-card" className={className} />
  }

  if (status === 'error') {
    return (
      <ErrorState
        onRetry={onRetry || (() => {})}
        className={className}
      />
    )
  }

  async function handleDismiss() {
    setIsDismissing(true)
    try {
      await onDismiss()
    } finally {
      setIsDismissing(false)
    }
  }

  const displayDescription = type === 'description' ? enhancedDescription : description

  return (
    <div
      className={cn(
        'w-72 shrink-0 rounded-lg border bg-card p-4 transition-opacity',
        isDismissing && 'opacity-50',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <AiDraftBadge />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleDismiss}
          disabled={isDismissing || status === 'accepting'}
          aria-label="Dismiss suggestion"
          className="size-6"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Project and duration row */}
        {type === 'entry' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {projectColor && (
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: projectColor }}
                  aria-hidden="true"
                />
              )}
              <span className="font-medium text-sm">{projectName}</span>
            </div>
            {duration && (
              <span className="text-sm text-muted-foreground">
                {formatDuration(duration)}
              </span>
            )}
          </div>
        )}

        {/* Time window */}
        {timeWindow && (
          <p className="text-xs text-muted-foreground">
            {formatTimeWindow(timeWindow.start, timeWindow.end)}
          </p>
        )}

        {/* Description */}
        {displayDescription && (
          <p className="text-sm text-foreground line-clamp-2">
            {displayDescription}
          </p>
        )}

        {/* Area name for context */}
        {areaName && type === 'entry' && (
          <p className="text-xs text-muted-foreground">{areaName}</p>
        )}

        {/* Evidence chips */}
        {evidenceLines.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {evidenceLines.map((evidence, i) => (
              <EvidenceChip
                key={i}
                icon={evidence.icon}
                text={evidence.text}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="pt-2">
          <ActionRow
            onAccept={onAccept}
            onEdit={onEdit}
            isLoading={status === 'accepting'}
          />
        </div>
      </div>
    </div>
  )
}
