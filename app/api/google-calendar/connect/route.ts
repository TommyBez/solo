import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import {
  getGoogleOAuthAuthorizationUrl,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar/oauth'

const OAUTH_STATE_COOKIE = 'google_calendar_oauth_state'
const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10

function redirectToTime(request: NextRequest, status: string) {
  const url = new URL('/time', request.url)
  url.searchParams.set('googleCalendar', status)
  return url
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    const signInUrl = new URL('/sign-in', request.url)
    return NextResponse.redirect(signInUrl)
  }

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(redirectToTime(request, 'missing-config'))
  }

  const state = crypto.randomUUID()
  const authUrl = getGoogleOAuthAuthorizationUrl(state)
  const response = NextResponse.redirect(authUrl)
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
