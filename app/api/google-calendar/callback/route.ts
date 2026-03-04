import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import {
  exchangeGoogleCodeForTokens,
  fetchGoogleUserEmail,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar/oauth'
import { saveGoogleCalendarConnection } from '@/lib/google-calendar/service'

const OAUTH_STATE_COOKIE = 'google_calendar_oauth_state'

function buildSettingsRedirect(request: NextRequest, status: string) {
  const url = new URL('/settings', request.url)
  url.searchParams.set('googleCalendar', status)
  return NextResponse.redirect(url)
}

function clearOAuthStateCookie(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}

export async function GET(request: NextRequest) {
  if (!isGoogleCalendarConfigured()) {
    return clearOAuthStateCookie(buildSettingsRedirect(request, 'missing-config'))
  }

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const authError = requestUrl.searchParams.get('error')
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value

  if (authError) {
    return clearOAuthStateCookie(buildSettingsRedirect(request, 'connect-failed'))
  }

  if (!(code && state && storedState && state === storedState)) {
    return clearOAuthStateCookie(buildSettingsRedirect(request, 'invalid-state'))
  }

  const session = await getSession()
  if (!session?.user) {
    return clearOAuthStateCookie(buildSettingsRedirect(request, 'unauthorized'))
  }

  try {
    const tokenPayload = await exchangeGoogleCodeForTokens(code)
    const email = await fetchGoogleUserEmail(tokenPayload.accessToken)
    await saveGoogleCalendarConnection({
      userId: session.user.id,
      email,
      tokenPayload,
    })
    return clearOAuthStateCookie(buildSettingsRedirect(request, 'connected'))
  } catch {
    return clearOAuthStateCookie(buildSettingsRedirect(request, 'connect-failed'))
  }
}
