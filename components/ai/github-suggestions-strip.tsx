'use client'

import { formatDistanceToNow } from 'date-fns'
import { Github, RefreshCw, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { generateGitHubSuggestions } from '@/lib/ai/time-capture'
import type { CachedSuggestion } from '@/lib/redis/suggestions-cache'
import { GitHubSuggestionCard } from './github-suggestion-card'

interface Project {
  id: number
  name: string
}

interface GitHubSuggestionsStripProps {
  githubConnected: boolean
  projects: Project[]
}

export function GitHubSuggestionsStrip({
  projects,
  githubConnected,
}: GitHubSuggestionsStripProps) {
  const hasLoadedRef = useRef(false)
  const [suggestions, setSuggestions] = useState<CachedSuggestion[]>([])
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(new Set())

  // Filter out locally dismissed suggestions
  const visibleSuggestions = suggestions.filter(
    (s) => s.status === 'pending' && !localDismissed.has(s.id),
  )

  const loadSuggestions = useCallback(
    async (forceRefresh: boolean, showToast: boolean) => {
      try {
        const result = await generateGitHubSuggestions({ forceRefresh })
        setSuggestions(result.suggestions)
        setLastGenerated(result.generatedAt)
        setLocalDismissed(new Set())

        if (showToast) {
          toast.success(
            result.suggestions.length > 0
              ? `Found ${result.suggestions.length} suggestion${result.suggestions.length === 1 ? '' : 's'}`
              : 'No high-confidence missing time found',
          )
        }
      } catch {
        if (showToast) {
          toast.error('Failed to refresh suggestions')
        }
      } finally {
        setIsInitialLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!githubConnected || hasLoadedRef.current) {
      return
    }

    hasLoadedRef.current = true
    setIsInitialLoading(true)
    loadSuggestions(false, false)
  }, [githubConnected, loadSuggestions])

  function handleRefresh() {
    startRefreshTransition(async () => {
      await loadSuggestions(true, true)
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
  let content = (
    <div className="rounded-lg border border-dashed p-4 text-center">
      <p className="text-muted-foreground text-sm">
        No high-confidence missing time entries found from recent GitHub work.
      </p>
    </div>
  )

  if (isInitialLoading) {
    content = (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {['skeleton-1', 'skeleton-2'].map((itemId) => (
          <div className="min-w-[320px] max-w-[360px] space-y-3" key={itemId}>
            <Skeleton className="h-36 rounded-lg" />
          </div>
        ))}
      </div>
    )
  } else if (visibleSuggestions.length > 0) {
    content = (
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
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-medium text-sm">
            <Sparkles className="size-4 text-primary" />
            <span>Missing Time Suggestions</span>
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

      {content}
    </div>
  )
}
