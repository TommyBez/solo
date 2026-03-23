'use client'

import { formatDistanceToNow } from 'date-fns'
import { Github, RefreshCw, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generateGitHubSuggestions } from '@/lib/ai/time-capture'
import type { CachedSuggestion } from '@/lib/redis/suggestions-cache'
import { GitHubSuggestionCard } from './github-suggestion-card'

interface Project {
  id: number
  name: string
}

interface GitHubSuggestionsStripProps {
  generatedAt: string | null
  githubConnected: boolean
  initialSuggestions: CachedSuggestion[]
  projects: Project[]
}

export function GitHubSuggestionsStrip({
  initialSuggestions,
  generatedAt,
  projects,
  githubConnected,
}: GitHubSuggestionsStripProps) {
  const router = useRouter()
  const [suggestions, setSuggestions] =
    useState<CachedSuggestion[]>(initialSuggestions)
  const [lastGenerated, setLastGenerated] = useState<string | null>(generatedAt)
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(new Set())

  // Filter out locally dismissed suggestions
  const visibleSuggestions = suggestions.filter(
    (s) => s.status === 'pending' && !localDismissed.has(s.id),
  )

  function handleRefresh() {
    startRefreshTransition(async () => {
      try {
        const result = await generateGitHubSuggestions({ forceRefresh: true })
        setSuggestions(result.suggestions)
        setLastGenerated(result.generatedAt)
        setLocalDismissed(new Set())
        router.refresh()
        toast.success(
          result.suggestions.length > 0
            ? `Found ${result.suggestions.length} suggestion${result.suggestions.length === 1 ? '' : 's'}`
            : 'No new suggestions found',
        )
      } catch {
        toast.error('Failed to refresh suggestions')
      }
    })
  }

  function handleDismiss(suggestionId: string) {
    setLocalDismissed((prev) => new Set([...prev, suggestionId]))
  }

  function handleAccept(suggestionId: string) {
    setLocalDismissed((prev) => new Set([...prev, suggestionId]))
  }

  // Don't show if GitHub is not connected
  if (!githubConnected) {
    return null
  }

  // Project lookup map
  const projectMap = new Map(projects.map((p) => [p.id, p.name]))

  const generatedTimeAgo = lastGenerated
    ? formatDistanceToNow(new Date(lastGenerated), { addSuffix: true })
    : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-medium text-sm">
            <Sparkles className="size-4 text-primary" />
            <span>AI Suggestions</span>
            <Github className="ml-1 size-3.5 text-muted-foreground" />
          </div>
          {generatedTimeAgo && (
            <span className="text-muted-foreground text-xs">
              Updated {generatedTimeAgo}
            </span>
          )}
        </div>
        <Button
          className="h-7 text-xs"
          disabled={isRefreshing}
          onClick={handleRefresh}
          size="sm"
          variant="ghost"
        >
          <RefreshCw
            className={`mr-1 size-3 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {visibleSuggestions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="text-muted-foreground text-sm">
            No pending suggestions. Click refresh to check for new GitHub
            activity.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {visibleSuggestions.map((suggestion) => (
            <div className="min-w-[300px] max-w-[350px]" key={suggestion.id}>
              <GitHubSuggestionCard
                onAccept={() => handleAccept(suggestion.id)}
                onDismiss={() => handleDismiss(suggestion.id)}
                projectName={
                  suggestion.projectId
                    ? projectMap.get(suggestion.projectId) || 'Unknown'
                    : 'No project'
                }
                suggestion={suggestion}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
