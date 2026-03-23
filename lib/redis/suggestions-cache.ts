import { redis } from './client'

const CACHE_TTL = 86400 // 24 hours in seconds
const CACHE_PREFIX = 'ai-suggestions'

export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed'

export interface CachedSuggestion {
  id: string
  type: 'github_commit' | 'github_pr' | 'github_review'
  sourceId: string
  projectId: number | null
  description: string
  durationMinutes: number
  date: string
  status: SuggestionStatus
  metadata: {
    repoName: string
    repoFullName: string
    commitSha?: string
    commitMessage?: string
    prNumber?: number
    prTitle?: string
    additions?: number
    deletions?: number
    reviewState?: string
    url: string
  }
  generatedAt: string
}

export interface SuggestionsCache {
  suggestions: CachedSuggestion[]
  generatedAt: string
  expiresAt: string
}

function getCacheKey(orgId: string, userId: string): string {
  return `${CACHE_PREFIX}:${orgId}:${userId}`
}

export async function getCachedSuggestions(
  orgId: string,
  userId: string
): Promise<SuggestionsCache | null> {
  const key = getCacheKey(orgId, userId)
  const cached = await redis.get<SuggestionsCache>(key)
  return cached
}

export async function setCachedSuggestions(
  orgId: string,
  userId: string,
  suggestions: CachedSuggestion[]
): Promise<void> {
  const key = getCacheKey(orgId, userId)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CACHE_TTL * 1000)

  const cache: SuggestionsCache = {
    suggestions,
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }

  await redis.set(key, cache, { ex: CACHE_TTL })
}

export async function invalidateSuggestionsCache(
  orgId: string,
  userId: string
): Promise<void> {
  const key = getCacheKey(orgId, userId)
  await redis.del(key)
}

export async function updateSuggestionStatus(
  orgId: string,
  userId: string,
  suggestionId: string,
  status: 'accepted' | 'dismissed'
): Promise<void> {
  const cache = await getCachedSuggestions(orgId, userId)
  if (!cache) return

  const updatedSuggestions = cache.suggestions.map((s) =>
    s.id === suggestionId ? { ...s, status } : s
  )

  const key = getCacheKey(orgId, userId)
  const updatedCache: SuggestionsCache = {
    ...cache,
    suggestions: updatedSuggestions,
  }

  // Calculate remaining TTL
  const remainingTTL = Math.max(
    1,
    Math.floor((new Date(cache.expiresAt).getTime() - Date.now()) / 1000)
  )

  await redis.set(key, updatedCache, { ex: remainingTTL })
}

export async function getCacheMetadata(
  orgId: string,
  userId: string
): Promise<{ generatedAt: string; expiresAt: string } | null> {
  const cache = await getCachedSuggestions(orgId, userId)
  if (!cache) return null

  return {
    generatedAt: cache.generatedAt,
    expiresAt: cache.expiresAt,
  }
}
