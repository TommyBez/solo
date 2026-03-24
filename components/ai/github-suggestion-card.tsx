'use client'

import {
  Check,
  Clock,
  ExternalLink,
  Github,
  Loader2,
  Pencil,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
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
import { Input } from '@/components/ui/input'
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
  const [isEditing, setIsEditing] = useState(false)
  const [editedDescription, setEditedDescription] = useState(
    suggestion.description,
  )
  const inputRef = useRef<HTMLInputElement>(null)

  if (isHidden) {
    return null
  }

  function handleAccept(description: string) {
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
          description,
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

  function handleStartEdit() {
    setIsEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setEditedDescription(suggestion.description)
  }

  function handleSaveEdit() {
    if (editedDescription.trim()) {
      handleAccept(editedDescription.trim())
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSaveEdit()
    } else if (event.key === 'Escape') {
      handleCancelEdit()
    }
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
          <Badge className="text-xs" variant="outline">
            {suggestion.metadata.repoName}
          </Badge>
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
        {isEditing ? (
          <Input
            className="mt-1 h-8 text-sm"
            onChange={(e) => setEditedDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the work..."
            ref={inputRef}
            value={editedDescription}
          />
        ) : (
          <CardTitle className="font-medium text-sm">
            {suggestion.description}
          </CardTitle>
        )}
        <CardDescription className="flex flex-wrap items-center gap-3 text-xs">
          <span>{formattedDate}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {durationText}
          </span>
          <span className="flex items-center gap-1">
            <Github className="size-3" />
            {projectName || 'Unknown'}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                disabled={isAccepting || !editedDescription.trim()}
                onClick={handleSaveEdit}
                size="sm"
              >
                {isAccepting ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <Check className="mr-1 size-3" />
                )}
                Save
              </Button>
              <Button
                disabled={isAccepting}
                onClick={handleCancelEdit}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                disabled={isAccepting || isDismissing}
                onClick={() => handleAccept(suggestion.description)}
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
                onClick={handleStartEdit}
                size="sm"
                variant="outline"
              >
                <Pencil className="mr-1 size-3" />
                Edit
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
