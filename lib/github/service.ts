import 'server-only'
import { and, eq } from 'drizzle-orm'
import { account } from '@/lib/auth/schema'
import { db } from '@/lib/db'
import {
  fetchGitHubUser,
  fetchGitHubUserEvents,
  isGitHubConfigured,
} from './oauth'
import {
  GITHUB_PROVIDER_ID,
  type GitHubActivity,
  type GitHubConnectionStatus,
  type GitHubTokenPayload,
} from './types'

function getGitHubAccount(userId: string) {
  return db.query.account.findFirst({
    where: and(
      eq(account.userId, userId),
      eq(account.providerId, GITHUB_PROVIDER_ID),
    ),
  })
}

export async function saveGitHubConnection(params: {
  username: string
  tokenPayload: GitHubTokenPayload
  userId: string
}) {
  const existing = await getGitHubAccount(params.userId)

  if (existing) {
    const updatedRows = await db
      .update(account)
      .set({
        accountId: params.username,
        accessToken: params.tokenPayload.accessToken,
        scope: params.tokenPayload.scope,
        updatedAt: new Date(),
      })
      .where(eq(account.id, existing.id))
      .returning()

    return updatedRows[0]
  }

  const insertedRows = await db
    .insert(account)
    .values({
      id: crypto.randomUUID(),
      accountId: params.username,
      providerId: GITHUB_PROVIDER_ID,
      userId: params.userId,
      accessToken: params.tokenPayload.accessToken,
      scope: params.tokenPayload.scope,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return insertedRows[0]
}

export async function disconnectGitHubForUser(userId: string) {
  await db
    .delete(account)
    .where(
      and(
        eq(account.userId, userId),
        eq(account.providerId, GITHUB_PROVIDER_ID),
      ),
    )
}

export async function getGitHubStatusForUser(
  userId: string,
): Promise<GitHubConnectionStatus> {
  const enabled = isGitHubConfigured()
  if (!enabled) {
    return {
      enabled: false,
      connected: false,
    }
  }

  const githubAccount = await getGitHubAccount(userId)
  return {
    enabled: true,
    connected: Boolean(githubAccount?.accessToken),
    connectedUsername: githubAccount?.accountId || undefined,
  }
}

export async function getGitHubActivityForUser(params: {
  userId: string
  since: Date
}): Promise<GitHubActivity[]> {
  if (!isGitHubConfigured()) {
    console.warn('[GitHub] Not configured, skipping activity fetch')
    return []
  }

  const githubAccount = await getGitHubAccount(params.userId)
  if (!(githubAccount?.accessToken && githubAccount.accountId)) {
    console.warn('[GitHub] No valid access token, skipping activity fetch')
    return []
  }

  try {
    // Verify token is still valid by fetching user
    await fetchGitHubUser(githubAccount.accessToken)

    const activities = await fetchGitHubUserEvents(
      githubAccount.accessToken,
      githubAccount.accountId,
      params.since,
    )
    console.log(`[GitHub] Fetched ${activities.length} activities`)
    return activities
  } catch (error) {
    console.error('[GitHub] Failed to fetch activities:', error)
    return []
  }
}
