import 'server-only'
import type {
  GitHubActivity,
  GitHubEvent,
  GitHubTokenPayload,
  GitHubUser,
} from './types'

const GITHUB_AUTH_ENDPOINT = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token'
const GITHUB_API_BASE = 'https://api.github.com'
const GITHUB_SCOPES = ['read:user', 'read:repo']

interface GitHubOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface GitHubTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
  scope?: string
  token_type?: string
}

function getAppUrl() {
  return process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL
}

function getGitHubOAuthConfig(): GitHubOAuthConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const appUrl = getAppUrl()

  if (!(clientId && clientSecret && appUrl)) {
    return null
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/github/callback`,
  }
}

function getGitHubOAuthConfigOrThrow(): GitHubOAuthConfig {
  const config = getGitHubOAuthConfig()
  if (!config) {
    throw new Error('GitHub OAuth is not configured')
  }
  return config
}

export function isGitHubConfigured() {
  return Boolean(getGitHubOAuthConfig())
}

export function getGitHubConfigHelpText() {
  return 'Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, BETTER_AUTH_URL'
}

export function getGitHubOAuthAuthorizationUrl(state: string) {
  const config = getGitHubOAuthConfigOrThrow()
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: GITHUB_SCOPES.join(' '),
    state,
  })
  return `${GITHUB_AUTH_ENDPOINT}?${params.toString()}`
}

export async function exchangeGitHubCodeForTokens(
  code: string,
): Promise<GitHubTokenPayload> {
  const config = getGitHubOAuthConfigOrThrow()

  const response = await fetch(GITHUB_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as GitHubTokenResponse

  if (payload.error || !payload.access_token) {
    const message =
      payload.error_description || payload.error || 'Unknown error'
    throw new Error(`GitHub token exchange failed: ${message}`)
  }

  return {
    accessToken: payload.access_token,
    tokenType: payload.token_type || 'bearer',
    scope: payload.scope || '',
  }
}

export async function fetchGitHubUser(
  accessToken: string,
): Promise<GitHubUser> {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub user profile')
  }

  return response.json() as Promise<GitHubUser>
}

export async function fetchGitHubUserEvents(
  accessToken: string,
  username: string,
  since: Date,
): Promise<GitHubActivity[]> {
  const activities: GitHubActivity[] = []
  let page = 1
  const perPage = 100
  const sinceTime = since.getTime()

  // GitHub Events API returns up to 300 events from the last 90 days
  while (page <= 3) {
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/events?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      console.error('[GitHub] Failed to fetch events:', response.status)
      break
    }

    const events = (await response.json()) as GitHubEvent[]
    if (events.length === 0) {
      break
    }

    for (const event of events) {
      const eventTime = new Date(event.created_at).getTime()
      if (eventTime < sinceTime) {
        // Events are sorted by date desc, so we can stop here
        return activities
      }

      const mapped = mapEventToActivity(event)
      if (mapped) {
        activities.push(...mapped)
      }
    }

    page++
  }

  return activities
}

function mapEventToActivity(event: GitHubEvent): GitHubActivity[] {
  const repoName = event.repo.name.split('/')[1] || event.repo.name
  const repoFullName = event.repo.name

  switch (event.type) {
    case 'PushEvent': {
      const commits = event.payload.commits || []
      return commits.map((commit) => ({
        id: `${event.id}-${commit.sha}`,
        type: 'commit' as const,
        description: commit.message.split('\n')[0], // First line only
        repoName,
        repoFullName,
        timestamp: event.created_at,
        url: commit.url
          .replace('api.github.com/repos', 'github.com')
          .replace('/commits/', '/commit/'),
        metadata: {
          commitSha: commit.sha,
          commitMessage: commit.message,
        },
      }))
    }

    case 'PullRequestEvent': {
      const pr = event.payload.pull_request
      if (!pr) {
        return []
      }

      // Only track merged PRs and newly opened PRs
      if (event.payload.action === 'closed' && pr.merged) {
        return [
          {
            id: `${event.id}-pr-merged`,
            type: 'pr_merged' as const,
            description: `Merged PR: ${pr.title}`,
            repoName,
            repoFullName,
            timestamp: pr.merged_at || event.created_at,
            url: pr.html_url,
            metadata: {
              prNumber: pr.number,
              prTitle: pr.title,
              additions: pr.additions,
              deletions: pr.deletions,
            },
          },
        ]
      }

      if (event.payload.action === 'opened') {
        return [
          {
            id: `${event.id}-pr-opened`,
            type: 'pr_opened' as const,
            description: `Opened PR: ${pr.title}`,
            repoName,
            repoFullName,
            timestamp: event.created_at,
            url: pr.html_url,
            metadata: {
              prNumber: pr.number,
              prTitle: pr.title,
              additions: pr.additions,
              deletions: pr.deletions,
            },
          },
        ]
      }

      return []
    }

    case 'PullRequestReviewEvent': {
      const pr = event.payload.pull_request
      const review = event.payload.review
      if (!(pr && review)) {
        return []
      }

      return [
        {
          id: `${event.id}-review`,
          type: 'review' as const,
          description: `Reviewed PR: ${pr.title}`,
          repoName,
          repoFullName,
          timestamp: event.created_at,
          url: review.html_url,
          metadata: {
            prNumber: pr.number,
            prTitle: pr.title,
            reviewState: review.state,
          },
        },
      ]
    }

    default:
      return []
  }
}
