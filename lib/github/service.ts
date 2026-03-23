import 'server-only'
import { and, eq } from 'drizzle-orm'
import { account } from '@/lib/auth/schema'
import { db } from '@/lib/db'
import {
  fetchGitHubUser,
  fetchGitHubUserEvents,
  isGitHubConfigured,
  refreshGitHubUserAccessToken,
} from './oauth'
import {
  GITHUB_PROVIDER_ID,
  type GitHubActivity,
  type GitHubConnectionStatus,
  type GitHubTokenPayload,
} from './types'

const GITHUB_ACCESS_EXPIRY_SKEW_MS = 5 * 60 * 1000

function getGitHubAccount(userId: string) {
  return db.query.account.findFirst({
    where: and(
      eq(account.userId, userId),
      eq(account.providerId, GITHUB_PROVIDER_ID),
    ),
  })
}

/** Returns a non-expired access token, refreshing via refresh_token when needed. */
export async function getValidGitHubAccessTokenForUser(
  userId: string,
): Promise<{ accessToken: string; accountId: string } | null> {
  const acc = await getGitHubAccount(userId)
  if (!(acc?.accessToken && acc.accountId)) {
    return null
  }

  const expiresAtMs = acc.accessTokenExpiresAt?.getTime()
  const now = Date.now()
  const isExpiredOrSoon =
    expiresAtMs !== undefined &&
    expiresAtMs <= now + GITHUB_ACCESS_EXPIRY_SKEW_MS

  if (!isExpiredOrSoon) {
    return { accessToken: acc.accessToken, accountId: acc.accountId }
  }

  if (!acc.refreshToken) {
    console.warn(
      '[GitHub] Access token expired or expiring soon and no refresh token stored',
    )
    return null
  }

  try {
    const payload = await refreshGitHubUserAccessToken(acc.refreshToken)
    const nextRefresh = payload.refreshToken ?? acc.refreshToken
    const refreshTokenRotated =
      Boolean(payload.refreshToken) && payload.refreshToken !== acc.refreshToken

    await db
      .update(account)
      .set({
        accessToken: payload.accessToken,
        refreshToken: nextRefresh,
        accessTokenExpiresAt: payload.accessTokenExpiresAt ?? null,
        refreshTokenExpiresAt: refreshTokenRotated
          ? (payload.refreshTokenExpiresAt ?? null)
          : acc.refreshTokenExpiresAt,
        scope: payload.scope,
        updatedAt: new Date(),
      })
      .where(eq(account.id, acc.id))

    return { accessToken: payload.accessToken, accountId: acc.accountId }
  } catch (error) {
    console.error('[GitHub] Token refresh failed:', error)
    return null
  }
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
        refreshToken: params.tokenPayload.refreshToken ?? null,
        accessTokenExpiresAt: params.tokenPayload.accessTokenExpiresAt ?? null,
        refreshTokenExpiresAt:
          params.tokenPayload.refreshTokenExpiresAt ?? null,
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
      refreshToken: params.tokenPayload.refreshToken ?? null,
      accessTokenExpiresAt: params.tokenPayload.accessTokenExpiresAt ?? null,
      refreshTokenExpiresAt: params.tokenPayload.refreshTokenExpiresAt ?? null,
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

  const tokenResult = await getValidGitHubAccessTokenForUser(params.userId)
  if (!tokenResult) {
    console.warn('[GitHub] No valid access token, skipping activity fetch')
    return []
  }

  try {
    await fetchGitHubUser(tokenResult.accessToken)

    const activities = await fetchGitHubUserEvents(
      tokenResult.accessToken,
      tokenResult.accountId,
      params.since,
    )
    console.log(`[GitHub] Fetched ${activities.length} activities`)
    return activities
  } catch (error) {
    console.error('[GitHub] Failed to fetch activities:', error)
    return []
  }
}
