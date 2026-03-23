'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { EvidenceIcon, SuggestionStatus } from '@/lib/ai/schemas'
import { cn } from '@/lib/utils'
import { ActionRow } from './action-row'
import { AiDraftBadge } from './ai-draft-badge'
import { ErrorState } from './error-state'
import { EvidenceChip } from './evidence-chip'
import { LoadingSkeleton } from './loading-skeleton'

interface SuggestionCardProps {
  areaName?: string

  className?: string
  description?: string
  duration?: number

  // For description suggestions
  enhancedDescription?: string

  // Evidence
  evidenceLines: Array<{
    icon?: EvidenceIcon
    text: string
  }>

  // Actions
  onAccept: () => Promise<void>
  onDismiss: () => Promise<void>
  onEdit: () => void
  onRetry?: () => void
  projectColor?: string

  // For entry suggestions
  projectName?: string
  status: SuggestionStatus
  timeWindow?: { start: Date; end: Date }
  type: 'entry' | 'description'
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) {
    return `${mins}m`
  }
  if (mins === 0) {
    return `${hours}h`
  }
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
    return <LoadingSkeleton className={className} type="suggestion-card" />
  }

  if (status === 'error') {
    return (
      <ErrorState
        className={className}
        onRetry={onRetry ?? (() => undefined)}
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

  const displayDescription =
    type === 'description' ? enhancedDescription : description

  return (
    <div
      className={cn(
        'w-72 shrink-0 rounded-lg border bg-card p-4 transition-opacity',
        isDismissing && 'opacity-50',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <AiDraftBadge />
        <Button
          aria-label="Dismiss suggestion"
          className="size-6"
          disabled={isDismissing || status === 'accepting'}
          onClick={handleDismiss}
          size="icon-xs"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-4" />
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
                  aria-hidden="true"
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: projectColor }}
                />
              )}
              <span className="font-medium text-sm">{projectName}</span>
            </div>
            {duration && (
              <span className="text-muted-foreground text-sm">
                {formatDuration(duration)}
              </span>
            )}
          </div>
        )}

        {/* Time window */}
        {timeWindow && (
          <p className="text-muted-foreground text-xs">
            {formatTimeWindow(timeWindow.start, timeWindow.end)}
          </p>
        )}

        {/* Description */}
        {displayDescription && (
          <p className="line-clamp-2 text-foreground text-sm">
            {displayDescription}
          </p>
        )}

        {/* Area name for context */}
        {areaName && type === 'entry' && (
          <p className="text-muted-foreground text-xs">{areaName}</p>
        )}

        {/* Evidence chips */}
        {evidenceLines.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {evidenceLines.map((evidence) => (
              <EvidenceChip
                icon={evidence.icon}
                key={`${evidence.text}-${evidence.icon ?? ''}`}
                text={evidence.text}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="pt-2">
          <ActionRow
            isLoading={status === 'accepting'}
            onAccept={onAccept}
            onEdit={onEdit}
          />
        </div>
      </div>
    </div>
  )
}
