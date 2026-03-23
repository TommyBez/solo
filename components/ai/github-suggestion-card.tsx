'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  Clock,
  ExternalLink,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createTimeEntry } from '@/lib/actions/time-entries'
import { updateCachedSuggestionStatus } from '@/lib/ai/time-capture'
import type { CachedSuggestion } from '@/lib/redis/suggestions-cache'

interface GitHubSuggestionCardProps {
  suggestion: CachedSuggestion
  projectName: string
  onAccept?: () => void
  onDismiss?: () => void
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

  if (isHidden) return null

  const typeIcon =
    suggestion.type === 'github_commit' ? (
      <GitCommit className="size-4" />
    ) : suggestion.type === 'github_pr' ? (
      <GitMerge className="size-4" />
    ) : (
      <GitPullRequest className="size-4" />
    )

  const typeLabel =
    suggestion.type === 'github_commit'
      ? 'Commit'
      : suggestion.type === 'github_pr'
        ? 'Pull Request'
        : 'Code Review'

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
          startTime.getTime() + suggestion.durationMinutes * 60 * 1000
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

  const hours = Math.floor(suggestion.durationMinutes / 60)
  const minutes = suggestion.durationMinutes % 60
  const durationText =
    hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`

  return (
    <Card className="border-border/50 bg-muted/30">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {typeIcon}
            <Badge variant="secondary" className="text-xs">
              {typeLabel}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {suggestion.metadata.repoName}
            </Badge>
          </div>
          {suggestion.metadata.url && (
            <a
              href={suggestion.metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
        <CardTitle className="text-sm font-medium">
          {suggestion.description}
        </CardTitle>
        <CardDescription className="flex items-center gap-3 text-xs">
          <span>{formattedDate}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {durationText}
          </span>
          <span className="text-muted-foreground">
            Project: {projectName || 'Unknown'}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isAccepting || isDismissing}
          >
            {isAccepting ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <Check className="mr-1 size-3" />
            )}
            Accept
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={isAccepting || isDismissing}
          >
            {isDismissing ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <X className="mr-1 size-3" />
            )}
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
