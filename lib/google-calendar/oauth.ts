import 'server-only'
import type { GoogleCalendarEvent, GoogleTokenPayload } from './types'

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_CALENDAR_EVENTS_ENDPOINT =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo'
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface GoogleTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
  expires_in?: number
  id_token?: string
  refresh_token?: string
  scope?: string
}

interface GoogleUserInfoResponse {
  email?: string
}

interface GoogleCalendarEventsResponse {
  items?: Array<{
    description?: string
    end?: {
      date?: string
      dateTime?: string
    }
    htmlLink?: string
    id?: string
    start?: {
      date?: string
      dateTime?: string
    }
    status?: string
    summary?: string
  }>
  nextPageToken?: string
}

function getAppUrl() {
  return process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL
}

function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = getAppUrl()

  if (!(clientId && clientSecret && appUrl)) {
    return null
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/google-calendar/callback`,
  }
}

function getGoogleOAuthConfigOrThrow(): GoogleOAuthConfig {
  const config = getGoogleOAuthConfig()
  if (!config) {
    throw new Error('Google Calendar OAuth is not configured')
  }
  return config
}

function parseGoogleTokenResponse(
  payload: GoogleTokenResponse,
): GoogleTokenPayload {
  if (!payload.access_token) {
    const message =
      payload.error_description || payload.error || 'Unknown error'
    throw new Error(`Google token exchange failed: ${message}`)
  }

  return {
    accessToken: payload.access_token,
    accessTokenExpiresAt:
      typeof payload.expires_in === 'number'
        ? new Date(Date.now() + payload.expires_in * 1000)
        : null,
    idToken: payload.id_token,
    refreshToken: payload.refresh_token,
    scope: payload.scope,
  }
}

async function postTokenRequest(body: URLSearchParams) {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    cache: 'no-store',
  })
  const payload = (await response.json()) as GoogleTokenResponse

  if (!response.ok) {
    const message =
      payload.error_description || payload.error || 'Unknown error'
    throw new Error(`Google token request failed: ${message}`)
  }

  return parseGoogleTokenResponse(payload)
}

function toIsoDateString(value: string) {
  return value.includes('T') ? value : `${value}T00:00:00.000Z`
}

export function isGoogleCalendarConfigured() {
  return Boolean(getGoogleOAuthConfig())
}

export function getGoogleCalendarConfigHelpText() {
  return 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BETTER_AUTH_URL'
}

export function getGoogleOAuthAuthorizationUrl(state: string) {
  const config = getGoogleOAuthConfigOrThrow()
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state,
  })
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`
}

export function exchangeGoogleCodeForTokens(code: string) {
  const config = getGoogleOAuthConfigOrThrow()
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
  })

  return postTokenRequest(body)
}

export function refreshGoogleAccessToken(refreshToken: string) {
  const config = getGoogleOAuthConfigOrThrow()
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  return postTokenRequest(body)
}

export async function fetchGoogleUserEmail(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Google user profile')
  }

  const payload = (await response.json()) as GoogleUserInfoResponse
  if (!payload.email) {
    throw new Error('Google profile did not include an email address')
  }

  return payload.email
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
) {
  const events: GoogleCalendarEvent[] = []
  let nextPageToken: string | undefined

  do {
    const params = new URLSearchParams({
      maxResults: '250',
      orderBy: 'startTime',
      singleEvents: 'true',
      timeMax: endDate.toISOString(),
      timeMin: startDate.toISOString(),
    })
    if (nextPageToken) {
      params.set('pageToken', nextPageToken)
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_EVENTS_ENDPOINT}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch Google Calendar events')
    }

    const payload = (await response.json()) as GoogleCalendarEventsResponse
    const mapped = (payload.items ?? [])
      .filter((item) => item.status !== 'cancelled')
      .flatMap((item) => {
        const startRaw = item.start?.dateTime || item.start?.date
        const endRaw = item.end?.dateTime || item.end?.date

        if (!(item.id && startRaw && endRaw)) {
          return []
        }

        const mappedEvent: GoogleCalendarEvent = {
          allDay: !item.start?.dateTime,
          endTime: toIsoDateString(endRaw),
          id: item.id,
          startTime: toIsoDateString(startRaw),
          title: item.summary?.trim() || 'Untitled event',
          ...(item.description ? { description: item.description } : {}),
          ...(item.htmlLink ? { htmlLink: item.htmlLink } : {}),
        }

        return [mappedEvent]
      })

    events.push(...mapped)
    nextPageToken = payload.nextPageToken
  } while (nextPageToken)

  return events
}
