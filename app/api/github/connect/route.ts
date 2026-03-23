import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import {
  getGitHubOAuthAuthorizationUrl,
  isGitHubConfigured,
} from '@/lib/github/oauth'

const OAUTH_STATE_COOKIE = 'github_oauth_state'
const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10

function redirectToSettings(request: NextRequest, status: string) {
  const url = new URL('/settings', request.url)
  url.searchParams.set('github', status)
  return url
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    const signInUrl = new URL('/sign-in', request.url)
    return NextResponse.redirect(signInUrl)
  }

  if (!isGitHubConfigured()) {
    return NextResponse.redirect(redirectToSettings(request, 'missing-config'))
  }

  const state = crypto.randomUUID()
  const authUrl = getGitHubOAuthAuthorizationUrl(state)
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
