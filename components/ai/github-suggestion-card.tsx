'use client'

import {
  Check,
  Clock,
  ExternalLink,
  Github,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createTimeEntry } from '@/lib/actions/time-entries'
import { updateCachedSuggestionStatus } from '@/lib/ai/time-capture'
import type { CachedSuggestion } from '@/lib/redis/suggestions-cache'

interface GitHubSuggestionCardProps {
  onAccept?: () => void
  onDismiss?: () => void
  projectName: string
  suggestion: CachedSuggestion
}

export function GitHubSuggestionCard({
  suggestion,
  projectName,
  onAccept,
  onDismiss,
}: GitHubSuggestionCardProps) {
  const router = useRouter()
  const [isAccepting, startAcceptTransition] = useTransition()
  const [isDismissing, startDismissTransition] = useTransition()
  const [isHidden, setIsHidden] = useState(false)

  if (isHidden) {
    return null
  }

  const confidenceBadgeVariant =
    suggestion.confidence === 'high' ? 'default' : 'secondary'

  function handleAccept() {
    startAcceptTransition(async () => {
      try {
        if (!suggestion.projectId) {
          toast.error('No project assigned to this suggestion')
          return
        }

        const entryDate = new Date(suggestion.date)
        const startTime = new Date(entryDate)
        startTime.setHours(9, 0, 0, 0) // Default to 9 AM

        const endTime = new Date(
          startTime.getTime() + suggestion.durationMinutes * 60 * 1000,
        )

        await createTimeEntry({
          projectId: suggestion.projectId,
          description: suggestion.description,
          startTime,
          endTime,
          durationMinutes: suggestion.durationMinutes,
        })

        await updateCachedSuggestionStatus({
          suggestionId: suggestion.id,
          status: 'accepted',
        })

        toast.success('Time entry created')
        setIsHidden(true)
        router.refresh()
        onAccept?.()
      } catch {
        toast.error('Failed to create time entry')
      }
    })
  }

  function handleDismiss() {
    startDismissTransition(async () => {
      try {
        await updateCachedSuggestionStatus({
          suggestionId: suggestion.id,
          status: 'dismissed',
        })

        setIsHidden(true)
        onDismiss?.()
      } catch {
        toast.error('Failed to dismiss suggestion')
      }
    })
  }

  const formattedDate = new Date(suggestion.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const activityWindow = `${new Date(
    suggestion.metadata.timeWindowStart,
  ).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${new Date(suggestion.metadata.timeWindowEnd).toLocaleTimeString(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  )}`

  const hours = Math.floor(suggestion.durationMinutes / 60)
  const minutes = suggestion.durationMinutes % 60
  const durationText =
    hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`

  return (
    <Card className="border-border/50 bg-muted/30">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <Badge className="text-xs" variant="secondary">
              Missing entry
            </Badge>
            <Badge className="text-xs" variant={confidenceBadgeVariant}>
              {suggestion.confidence} confidence
            </Badge>
            <Badge className="text-xs" variant="outline">
              {suggestion.metadata.repoName}
            </Badge>
          </div>
          {suggestion.metadata.primaryUrl && (
            <a
              className="text-muted-foreground hover:text-foreground"
              href={suggestion.metadata.primaryUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
        <CardTitle className="font-medium text-sm">
          {suggestion.description}
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-3 text-xs">
          <span>{formattedDate}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {durationText}
          </span>
          <span className="flex items-center gap-1">
            <Github className="size-3" />
            {activityWindow}
          </span>
          <span className="text-muted-foreground">
            Project: {projectName || 'Unknown'}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          <div className="rounded-md border bg-background/60 p-3">
            <p className="font-medium text-xs">Why this looks missing</p>
            <p className="mt-1 text-muted-foreground text-sm">
              {suggestion.reasoning}
            </p>
          </div>

          <div className="rounded-md border border-dashed p-3">
            <p className="font-medium text-xs">Solo duplicate check</p>
            <p className="mt-1 text-muted-foreground text-sm">
              {suggestion.metadata.duplicateCheck.summary}
            </p>
          </div>

          {suggestion.metadata.titles.length > 0 ? (
            <div className="space-y-1">
              <p className="font-medium text-xs">GitHub evidence</p>
              <ul className="space-y-1 text-muted-foreground text-sm">
                {suggestion.metadata.titles.slice(0, 3).map((title) => (
                  <li className="line-clamp-2" key={title}>
                    • {title}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {suggestion.metadata.existingEntryEvidence.length > 0 ? (
            <div className="space-y-1">
              <p className="font-medium text-xs">Tracked pattern in Solo</p>
              <ul className="space-y-1 text-muted-foreground text-sm">
                {suggestion.metadata.existingEntryEvidence.map((entry) => (
                  <li key={`${entry.date}-${entry.description}`}>
                    • {entry.date}: {entry.description} ({entry.durationMinutes}
                    m)
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Button
              disabled={isAccepting || isDismissing}
              onClick={handleAccept}
              size="sm"
            >
              {isAccepting ? (
                <Loader2 className="mr-1 size-3 animate-spin" />
              ) : (
                <Check className="mr-1 size-3" />
              )}
              Accept
            </Button>
            <Button
              disabled={isAccepting || isDismissing}
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
            >
              {isDismissing ? (
                <Loader2 className="mr-1 size-3 animate-spin" />
              ) : (
                <X className="mr-1 size-3" />
              )}
              Dismiss
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
