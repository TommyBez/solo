import 'server-only'
import type {
  GitHubActivity,
  GitHubEvent,
  GitHubPullRequestDetails,
  GitHubTokenPayload,
  GitHubUser,
} from './types'

const GITHUB_AUTH_ENDPOINT = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token'
const GITHUB_API_BASE = 'https://api.github.com'

interface GitHubOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface GitHubTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
  /** Seconds until the access token expires (GitHub App user tokens). */
  expires_in?: number
  refresh_token?: string
  refresh_token_expires_in?: number
  scope?: string
  token_type?: string
}

function getAppUrl() {
  // Prefer explicit BETTER_AUTH_URL, then NEXT_PUBLIC_APP_URL,
  // then fall back to Vercel's auto-generated URL for preview deployments
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return undefined
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
  return (
    'GitHub App: set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (from the app settings), ' +
    'BETTER_AUTH_URL, and enable expiring user tokens + refresh tokens on the GitHub App.'
  )
}

export function getGitHubOAuthAuthorizationUrl(state: string) {
  const config = getGitHubOAuthConfigOrThrow()
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
  })
  return `${GITHUB_AUTH_ENDPOINT}?${params.toString()}`
}

function mapGitHubTokenResponseToPayload(
  payload: GitHubTokenResponse,
): GitHubTokenPayload {
  if (payload.error || !payload.access_token) {
    const message =
      payload.error_description || payload.error || 'Unknown error'
    throw new Error(message)
  }

  const accessTokenExpiresAt =
    typeof payload.expires_in === 'number' &&
    Number.isFinite(payload.expires_in)
      ? new Date(Date.now() + payload.expires_in * 1000)
      : undefined

  const refreshTokenExpiresAt =
    typeof payload.refresh_token_expires_in === 'number' &&
    Number.isFinite(payload.refresh_token_expires_in)
      ? new Date(Date.now() + payload.refresh_token_expires_in * 1000)
      : undefined

  return {
    accessToken: payload.access_token,
    tokenType: payload.token_type || 'bearer',
    scope: payload.scope || '',
    refreshToken: payload.refresh_token,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  }
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
      redirect_uri: config.redirectUri,
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as GitHubTokenResponse

  try {
    return mapGitHubTokenResponseToPayload(payload)
  } catch (error) {
    const label = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`GitHub token exchange failed: ${label}`)
  }
}

export async function refreshGitHubUserAccessToken(
  refreshToken: string,
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
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as GitHubTokenResponse

  try {
    return mapGitHubTokenResponseToPayload(payload)
  } catch (error) {
    const label = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`GitHub token refresh failed: ${label}`)
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

/**
 * Fetches full PR details from the dedicated Pull Request API.
 * Returns null if the request fails (graceful degradation).
 */
async function fetchPullRequestDetails(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<GitHubPullRequestDetails | null> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pullNumber}`,
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
      console.error(
        `[GitHub] Failed to fetch PR #${pullNumber} details:`,
        response.status,
      )
      return null
    }

    return response.json() as Promise<GitHubPullRequestDetails>
  } catch (error) {
    console.error(`[GitHub] Error fetching PR #${pullNumber}:`, error)
    return null
  }
}

interface PrEnrichmentTarget {
  activity: GitHubActivity
  owner: string
  prNumber: number
  repo: string
}

function isPrActivityNeedingEnrichment(
  activity: GitHubActivity,
): activity is GitHubActivity & {
  type: 'pr_opened' | 'pr_merged' | 'review'
  metadata: { prNumber: number }
} {
  if (
    activity.type !== 'pr_opened' &&
    activity.type !== 'pr_merged' &&
    activity.type !== 'review'
  ) {
    return false
  }
  const prNumber = activity.metadata.prNumber
  return Boolean(prNumber && needsPrEnrichment(activity))
}

function maybeEnqueuePrEnrichment(
  event: GitHubEvent,
  activity: GitHubActivity,
  prEventsToEnrich: PrEnrichmentTarget[],
): void {
  if (!isPrActivityNeedingEnrichment(activity)) {
    return
  }
  const [owner, repo] = event.repo.name.split('/')
  if (!(owner && repo)) {
    return
  }
  prEventsToEnrich.push({
    activity,
    owner,
    repo,
    prNumber: activity.metadata.prNumber,
  })
}

/**
 * Appends activities from one event. Returns true if `since` was passed (stop paging).
 */
function appendActivitiesFromEvent(
  event: GitHubEvent,
  sinceTime: number,
  activities: GitHubActivity[],
  prEventsToEnrich: PrEnrichmentTarget[],
): boolean {
  const eventTime = new Date(event.created_at).getTime()
  if (eventTime < sinceTime) {
    return true
  }

  const mapped = mapEventToActivity(event)
  if (!mapped) {
    return false
  }

  for (const activity of mapped) {
    activities.push(activity)
    maybeEnqueuePrEnrichment(event, activity, prEventsToEnrich)
  }
  return false
}

async function fetchUserEventsPage(
  accessToken: string,
  username: string,
  page: number,
  perPage: number,
): Promise<GitHubEvent[] | null> {
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
    return null
  }

  return (await response.json()) as GitHubEvent[]
}

export async function fetchGitHubUserEvents(
  accessToken: string,
  username: string,
  since: Date,
): Promise<GitHubActivity[]> {
  const activities: GitHubActivity[] = []
  const prEventsToEnrich: PrEnrichmentTarget[] = []
  let page = 1
  const perPage = 100
  const sinceTime = since.getTime()

  // GitHub Events API returns up to 300 events from the last 90 days
  while (page <= 3) {
    const events = await fetchUserEventsPage(
      accessToken,
      username,
      page,
      perPage,
    )
    if (!events || events.length === 0) {
      break
    }

    let reachedEndOfTimeRange = false
    for (const event of events) {
      if (
        appendActivitiesFromEvent(
          event,
          sinceTime,
          activities,
          prEventsToEnrich,
        )
      ) {
        reachedEndOfTimeRange = true
        break
      }
    }

    if (reachedEndOfTimeRange) {
      break
    }
    page++
  }

  if (prEventsToEnrich.length > 0) {
    await enrichPrActivities(accessToken, prEventsToEnrich)
  }

  return activities
}

/**
 * Checks if a PR activity needs enrichment (missing key fields).
 */
function needsPrEnrichment(activity: GitHubActivity): boolean {
  const { prTitle, additions, prBody } = activity.metadata
  // Enrich if title is missing/undefined or if we don't have the PR body yet
  return !prTitle || additions === undefined || prBody === undefined
}

/**
 * Batch fetches PR details and enriches activity objects in-place.
 * Deduplicates requests for the same PR across multiple activities.
 */
async function enrichPrActivities(
  accessToken: string,
  prEvents: Array<{
    activity: GitHubActivity
    owner: string
    repo: string
    prNumber: number
  }>,
): Promise<void> {
  // Deduplicate: group activities by unique PR
  const prMap = new Map<
    string,
    {
      owner: string
      repo: string
      prNumber: number
      activities: GitHubActivity[]
    }
  >()

  for (const { activity, owner, repo, prNumber } of prEvents) {
    const key = `${owner}/${repo}#${prNumber}`
    const existing = prMap.get(key)
    if (existing) {
      existing.activities.push(activity)
    } else {
      prMap.set(key, { owner, repo, prNumber, activities: [activity] })
    }
  }

  // Fetch all unique PRs in parallel
  const fetchPromises = Array.from(prMap.values()).map(
    async ({ owner, repo, prNumber, activities }) => {
      const details = await fetchPullRequestDetails(
        accessToken,
        owner,
        repo,
        prNumber,
      )
      if (details) {
        // Apply enriched data to all activities referencing this PR
        for (const activity of activities) {
          applyPrDetailsToActivity(activity, details)
        }
      }
    },
  )

  await Promise.all(fetchPromises)
}

/**
 * Applies fetched PR details to an activity object in-place.
 */
function applyPrDetailsToActivity(
  activity: GitHubActivity,
  details: GitHubPullRequestDetails,
): void {
  // Update metadata with enriched fields
  activity.metadata.prTitle = details.title
  activity.metadata.prBody = details.body || undefined
  activity.metadata.branchName = details.head.ref
  activity.metadata.additions = details.additions
  activity.metadata.deletions = details.deletions
  activity.metadata.changedFiles = details.changed_files
  activity.metadata.labels = details.labels.map((l) => l.name)

  // Update the URL if it was missing
  if (!activity.url) {
    activity.url = details.html_url
  }

  // Update description with actual title
  const changeStats =
    details.additions !== undefined && details.deletions !== undefined
      ? ` (+${details.additions}/-${details.deletions})`
      : ''

  if (activity.type === 'pr_opened') {
    activity.description = `Opened PR: ${details.title}${changeStats}`
  } else if (activity.type === 'pr_merged') {
    activity.description = `Merged PR: ${details.title}${changeStats}`
  } else if (activity.type === 'review') {
    activity.description = `Reviewed PR: ${details.title}`
  }
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
