import { cacheLife, cacheTag } from 'next/cache'
import { and, eq, gte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { aiSuggestionDismissals } from '@/lib/db/schema'
import { requireOrganization } from '@/lib/auth/session'

async function getDismissedSuggestionsCached(
  userId: string,
  organizationId: string,
  since: Date
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('ai-suggestions')

  return db.query.aiSuggestionDismissals.findMany({
    where: and(
      eq(aiSuggestionDismissals.userId, userId),
      eq(aiSuggestionDismissals.organizationId, organizationId),
      gte(aiSuggestionDismissals.dismissedAt, since)
    ),
  })
}

export async function getDismissedSuggestions(
  since: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
) {
  const { session, organizationId } = await requireOrganization()
  return getDismissedSuggestionsCached(session.user.id, organizationId, since)
}

export async function getDismissedHashes(
  since: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
): Promise<Set<string>> {
  const dismissals = await getDismissedSuggestions(since)
  return new Set(dismissals.map((d) => d.suggestionHash))
}
