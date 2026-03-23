'use client'

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
import { useRouter } from 'next/navigation'
import { type ReactNode, useState, useTransition } from 'react'
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

  let typeIcon: ReactNode
  let typeLabel: string
  if (suggestion.type === 'github_commit') {
    typeIcon = <GitCommit className="size-4" />
    typeLabel = 'Commit'
  } else if (suggestion.type === 'github_pr') {
    typeIcon = <GitMerge className="size-4" />
    typeLabel = 'Pull Request'
  } else {
    typeIcon = <GitPullRequest className="size-4" />
    typeLabel = 'Code Review'
  }

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
            <Badge className="text-xs" variant="secondary">
              {typeLabel}
            </Badge>
            <Badge className="text-xs" variant="outline">
              {suggestion.metadata.repoName}
            </Badge>
          </div>
          {suggestion.metadata.url && (
            <a
              className="text-muted-foreground hover:text-foreground"
              href={suggestion.metadata.url}
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
      </CardContent>
    </Card>
  )
}
