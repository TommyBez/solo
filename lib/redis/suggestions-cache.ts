import { redis } from './client'

const CACHE_TTL = 86_400 // 24 hours in seconds
const CACHE_PREFIX = 'ai-suggestions'

export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed'
export type SuggestionConfidence = 'high' | 'medium' | 'low'
export type GitHubActivityType = 'commit' | 'pr_merged' | 'pr_opened' | 'review'

export interface SuggestionEvidenceEntry {
  date: string
  description: string
  durationMinutes: number
  projectName: string
}

export interface CachedSuggestion {
  confidence: SuggestionConfidence
  date: string
  description: string
  durationMinutes: number
  generatedAt: string
  id: string
  metadata: {
    activityCount: number
    activityIds: string[]
    activityTypes: GitHubActivityType[]
    duplicateCheck: {
      existingEntryCountOnDate: number
      hasProjectEntryOnDate: boolean
      minutesLoggedOnDate: number
      projectMinutesOnDate: number
      summary: string
    }
    existingEntryEvidence: SuggestionEvidenceEntry[]
    primaryUrl: string
    repoFullName: string
    repoName: string
    timeWindowEnd: string
    timeWindowStart: string
    titles: string[]
    urls: string[]
  }
  projectId: number | null
  reasoning: string
  sourceId: string
  status: SuggestionStatus
  type: 'missing_entry'
}

export interface SuggestionsCache {
  expiresAt: string
  generatedAt: string
  suggestions: CachedSuggestion[]
}

function getCacheKey(orgId: string, userId: string): string {
  return `${CACHE_PREFIX}:${orgId}:${userId}`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  return value as Record<string, unknown>
}

function getStringValue(
  record: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = record?.[key]
  return typeof value === 'string' ? value : null
}

function getNumberValue(
  record: Record<string, unknown> | null,
  key: string,
): number | null {
  const value = record?.[key]
  return typeof value === 'number' ? value : null
}

function getBooleanValue(
  record: Record<string, unknown> | null,
  key: string,
): boolean | null {
  const value = record?.[key]
  return typeof value === 'boolean' ? value : null
}

function getStringArrayValue(
  record: Record<string, unknown> | null,
  key: string,
): string[] {
  const value = record?.[key]
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function getObjectArrayValue<T>(
  record: Record<string, unknown> | null,
  key: string,
): T[] {
  const value = record?.[key]
  return Array.isArray(value) ? (value as T[]) : []
}

function normalizeDuplicateCheck(record: Record<string, unknown> | null) {
  return {
    existingEntryCountOnDate:
      getNumberValue(record, 'existingEntryCountOnDate') ?? 0,
    hasProjectEntryOnDate:
      getBooleanValue(record, 'hasProjectEntryOnDate') ?? false,
    minutesLoggedOnDate: getNumberValue(record, 'minutesLoggedOnDate') ?? 0,
    projectMinutesOnDate: getNumberValue(record, 'projectMinutesOnDate') ?? 0,
    summary:
      getStringValue(record, 'summary') ??
      'No overlapping Solo entry was found for this work window.',
  }
}

function normalizeMetadata(
  metadata: Record<string, unknown> | null,
  suggestion: {
    date?: string
    sourceId: string
  },
) {
  const titles = getStringArrayValue(metadata, 'titles')
  const urls = getStringArrayValue(metadata, 'urls')
  const activityIds = getStringArrayValue(metadata, 'activityIds')
  const activityTypes = getObjectArrayValue<GitHubActivityType>(
    metadata,
    'activityTypes',
  )
  const existingEntryEvidence = getObjectArrayValue<SuggestionEvidenceEntry>(
    metadata,
    'existingEntryEvidence',
  )
  const duplicateCheck = normalizeDuplicateCheck(
    asRecord(metadata?.duplicateCheck),
  )
  const timeWindowEnd =
    getStringValue(metadata, 'timeWindowEnd') ??
    suggestion.date ??
    new Date().toISOString()
  const timeWindowStart =
    getStringValue(metadata, 'timeWindowStart') ??
    suggestion.date ??
    new Date().toISOString()

  return {
    activityCount:
      getNumberValue(metadata, 'activityCount') ??
      Math.max(activityIds.length, titles.length, urls.length, 1),
    activityIds:
      activityIds.length > 0
        ? activityIds
        : [suggestion.sourceId].filter(Boolean),
    activityTypes,
    duplicateCheck,
    existingEntryEvidence,
    primaryUrl: getStringValue(metadata, 'primaryUrl') ?? urls[0] ?? '',
    repoFullName:
      getStringValue(metadata, 'repoFullName') ??
      getStringValue(metadata, 'repoName') ??
      '',
    repoName: getStringValue(metadata, 'repoName') ?? '',
    timeWindowEnd,
    timeWindowStart,
    titles,
    urls,
  }
}

function normalizeSuggestion(
  suggestion: Partial<CachedSuggestion> & {
    id: string
    sourceId: string
  },
  generatedAt: string,
): CachedSuggestion {
  const metadata = asRecord(suggestion.metadata)
  const normalizedMetadata = normalizeMetadata(metadata, suggestion)

  return {
    confidence:
      suggestion.confidence === 'medium' || suggestion.confidence === 'low'
        ? suggestion.confidence
        : 'high',
    date: suggestion.date ?? new Date().toISOString().split('T')[0],
    description: suggestion.description ?? '',
    durationMinutes: suggestion.durationMinutes ?? 0,
    generatedAt: suggestion.generatedAt ?? generatedAt,
    id: suggestion.id,
    metadata: normalizedMetadata,
    projectId: suggestion.projectId ?? null,
    reasoning:
      typeof suggestion.reasoning === 'string'
        ? suggestion.reasoning
        : 'This GitHub work appears to be missing from recent Solo entries.',
    sourceId: suggestion.sourceId,
    status:
      suggestion.status === 'accepted' || suggestion.status === 'dismissed'
        ? suggestion.status
        : 'pending',
    type: 'missing_entry',
  }
}

export async function getCachedSuggestions(
  orgId: string,
  userId: string,
): Promise<SuggestionsCache | null> {
  const key = getCacheKey(orgId, userId)
  const cached = await redis.get<SuggestionsCache>(key)
  if (!cached) {
    return null
  }

  return {
    ...cached,
    suggestions: cached.suggestions.map((suggestion) =>
      normalizeSuggestion(suggestion, cached.generatedAt),
    ),
  }
}

export async function setCachedSuggestions(
  orgId: string,
  userId: string,
  suggestions: CachedSuggestion[],
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
  userId: string,
): Promise<void> {
  const key = getCacheKey(orgId, userId)
  await redis.del(key)
}

export async function updateSuggestionStatus(
  orgId: string,
  userId: string,
  suggestionId: string,
  status: 'accepted' | 'dismissed',
): Promise<void> {
  const cache = await getCachedSuggestions(orgId, userId)
  if (!cache) {
    return
  }

  const updatedSuggestions = cache.suggestions.map((s) =>
    s.id === suggestionId ? { ...s, status } : s,
  )

  const key = getCacheKey(orgId, userId)
  const updatedCache: SuggestionsCache = {
    ...cache,
    suggestions: updatedSuggestions,
  }

  // Calculate remaining TTL
  const remainingTTL = Math.max(
    1,
    Math.floor((new Date(cache.expiresAt).getTime() - Date.now()) / 1000),
  )

  await redis.set(key, updatedCache, { ex: remainingTTL })
}

export async function getCacheMetadata(
  orgId: string,
  userId: string,
): Promise<{ generatedAt: string; expiresAt: string } | null> {
  const cache = await getCachedSuggestions(orgId, userId)
  if (!cache) {
    return null
  }

  return {
    generatedAt: cache.generatedAt,
    expiresAt: cache.expiresAt,
  }
}
