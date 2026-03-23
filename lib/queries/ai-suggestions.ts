import { and, eq, gte } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { requireOrganization } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { aiSuggestionDismissals } from '@/lib/db/schema'

function getDismissedSuggestionsCachedWithDate(
  userId: string,
  organizationId: string,
  since: Date,
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('ai-suggestions')

  return db.query.aiSuggestionDismissals.findMany({
    where: and(
      eq(aiSuggestionDismissals.userId, userId),
      eq(aiSuggestionDismissals.organizationId, organizationId),
      gte(aiSuggestionDismissals.dismissedAt, since),
    ),
  })
}

function getDismissedSuggestionsCachedAll(
  userId: string,
  organizationId: string,
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('ai-suggestions')

  return db.query.aiSuggestionDismissals.findMany({
    where: and(
      eq(aiSuggestionDismissals.userId, userId),
      eq(aiSuggestionDismissals.organizationId, organizationId),
    ),
  })
}

export async function getDismissedSuggestions(since?: Date) {
  const { session, organizationId } = await requireOrganization()
  if (since) {
    return getDismissedSuggestionsCachedWithDate(
      session.user.id,
      organizationId,
      since,
    )
  }
  return getDismissedSuggestionsCachedAll(session.user.id, organizationId)
}

export async function getDismissedHashes(since?: Date): Promise<Set<string>> {
  const dismissals = await getDismissedSuggestions(since)
  return new Set(dismissals.map((d) => d.suggestionHash))
}
