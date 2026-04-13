import 'server-only'
import { and, eq } from 'drizzle-orm'
import { account } from '@/lib/auth/schema'
import { db } from '@/lib/db'
import {
  fetchGoogleCalendarEvents,
  isGoogleCalendarConfigured,
  refreshGoogleAccessToken,
} from './oauth'
import {
  GOOGLE_CALENDAR_PROVIDER_ID,
  type GoogleCalendarConnectionStatus,
  type GoogleCalendarEvent,
  type GoogleTokenPayload,
} from './types'

function isTokenStillValid(expiresAt: Date | null) {
  if (!expiresAt) {
    return true
  }

  // Keep a small safety window to avoid edge-of-expiry requests.
  const expiryThreshold = Date.now() + 60 * 1000
  return expiresAt.getTime() > expiryThreshold
}

function getGoogleCalendarAccounts(userId: string) {
  return db.query.account.findMany({
    where: and(
      eq(account.userId, userId),
      eq(account.providerId, GOOGLE_CALENDAR_PROVIDER_ID),
    ),
  })
}

function getGoogleCalendarAccountByEmail(userId: string, email: string) {
  return db.query.account.findFirst({
    where: and(
      eq(account.userId, userId),
      eq(account.providerId, GOOGLE_CALENDAR_PROVIDER_ID),
      eq(account.accountId, email),
    ),
  })
}

export async function saveGoogleCalendarConnection(params: {
  email: string
  tokenPayload: GoogleTokenPayload
  userId: string
}) {
  const existing = await getGoogleCalendarAccountByEmail(
    params.userId,
    params.email,
  )
  const refreshToken =
    params.tokenPayload.refreshToken ?? existing?.refreshToken
  if (!refreshToken) {
    throw new Error('Google did not return a refresh token')
  }

  if (existing) {
    const updatedRows = await db
      .update(account)
      .set({
        accountId: params.email,
        accessToken: params.tokenPayload.accessToken,
        accessTokenExpiresAt: params.tokenPayload.accessTokenExpiresAt,
        idToken: params.tokenPayload.idToken,
        refreshToken,
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
      accountId: params.email,
      providerId: GOOGLE_CALENDAR_PROVIDER_ID,
      userId: params.userId,
      accessToken: params.tokenPayload.accessToken,
      refreshToken,
      idToken: params.tokenPayload.idToken,
      accessTokenExpiresAt: params.tokenPayload.accessTokenExpiresAt,
      scope: params.tokenPayload.scope,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return insertedRows[0]
}

export async function disconnectGoogleCalendarAccount(
  userId: string,
  accountId: string,
) {
  await db
    .delete(account)
    .where(
      and(
        eq(account.id, accountId),
        eq(account.userId, userId),
        eq(account.providerId, GOOGLE_CALENDAR_PROVIDER_ID),
      ),
    )
}

export async function disconnectAllGoogleCalendarAccounts(userId: string) {
  await db
    .delete(account)
    .where(
      and(
        eq(account.userId, userId),
        eq(account.providerId, GOOGLE_CALENDAR_PROVIDER_ID),
      ),
    )
}

export async function getGoogleCalendarStatusForUser(
  userId: string,
): Promise<GoogleCalendarConnectionStatus> {
  const enabled = isGoogleCalendarConfigured()
  if (!enabled) {
    return {
      enabled: false,
      connected: false,
      accounts: [],
    }
  }

  const calendarAccounts = await getGoogleCalendarAccounts(userId)
  const connectedAccounts = calendarAccounts
    .filter((a) => a.accessToken)
    .map((a) => ({ id: a.id, email: a.accountId }))

  return {
    enabled: true,
    connected: connectedAccounts.length > 0,
    accounts: connectedAccounts,
  }
}

async function ensureValidAccessToken(
  calendarAccount: Awaited<
    ReturnType<typeof getGoogleCalendarAccounts>
  >[number],
) {
  if (
    calendarAccount.accessToken &&
    isTokenStillValid(calendarAccount.accessTokenExpiresAt)
  ) {
    return calendarAccount.accessToken
  }

  if (!calendarAccount.refreshToken) {
    console.warn(
      `[Google Calendar] No refresh token available for ${calendarAccount.accountId}`,
    )
    return null
  }

  try {
    const refreshedToken = await refreshGoogleAccessToken(
      calendarAccount.refreshToken,
    )
    const updatedRows = await db
      .update(account)
      .set({
        accessToken: refreshedToken.accessToken,
        accessTokenExpiresAt: refreshedToken.accessTokenExpiresAt,
        idToken: refreshedToken.idToken,
        refreshToken:
          refreshedToken.refreshToken ?? calendarAccount.refreshToken,
        scope: refreshedToken.scope,
        updatedAt: new Date(),
      })
      .where(eq(account.id, calendarAccount.id))
      .returning()

    return updatedRows[0]?.accessToken ?? null
  } catch (error) {
    console.error(
      `[Google Calendar] Token refresh failed for ${calendarAccount.accountId}:`,
      error,
    )
    return null
  }
}

export async function getGoogleCalendarEventsForUser(params: {
  endDate: Date
  startDate: Date
  userId: string
}): Promise<GoogleCalendarEvent[]> {
  if (!isGoogleCalendarConfigured()) {
    console.warn('[Google Calendar] Not configured, skipping event fetch')
    return []
  }

  const calendarAccounts = await getGoogleCalendarAccounts(params.userId)
  if (calendarAccounts.length === 0) {
    console.warn('[Google Calendar] No accounts found, skipping event fetch')
    return []
  }

  const allEvents: GoogleCalendarEvent[] = []

  await Promise.all(
    calendarAccounts.map(async (calendarAccount) => {
      const accessToken = await ensureValidAccessToken(calendarAccount)
      if (!accessToken) {
        console.warn(
          `[Google Calendar] No valid access token for ${calendarAccount.accountId}, skipping`,
        )
        return
      }

      try {
        const events = await fetchGoogleCalendarEvents(
          accessToken,
          params.startDate,
          params.endDate,
        )
        const taggedEvents = events.map((event) => ({
          ...event,
          accountEmail: calendarAccount.accountId,
        }))
        allEvents.push(...taggedEvents)
        console.log(
          `[Google Calendar] Fetched ${events.length} events from ${calendarAccount.accountId}`,
        )
      } catch (error) {
        console.error(
          `[Google Calendar] Failed to fetch events from ${calendarAccount.accountId}:`,
          error,
        )
      }
    }),
  )

  // Sort merged events by start time
  allEvents.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  )

  return allEvents
}
