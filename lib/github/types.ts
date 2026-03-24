export const GITHUB_PROVIDER_ID = 'github'

export interface GitHubConnectionStatus {
  connected: boolean
  connectedUsername?: string
  enabled: boolean
}

export interface GitHubTokenPayload {
  accessToken: string
  accessTokenExpiresAt?: Date
  /** Present when the GitHub App uses expiring user access tokens. */
  refreshToken?: string
  refreshTokenExpiresAt?: Date
  scope: string
  tokenType: string
}

export interface GitHubUser {
  avatar_url: string
  email: string | null
  id: number
  login: string
  name: string | null
}

export interface GitHubActivity {
  description: string
  id: string
  metadata: {
    commitSha?: string
    commitMessage?: string
    prNumber?: number
    prTitle?: string
    prBody?: string
    branchName?: string
    additions?: number
    deletions?: number
    changedFiles?: number
    labels?: string[]
    reviewState?: string
  }
  repoFullName: string
  repoName: string
  timestamp: string
  type: 'commit' | 'pr_merged' | 'pr_opened' | 'review'
  url: string
}

export interface GitHubCommit {
  commit: {
    author: {
      name: string
      email: string
      date: string
    }
    message: string
  }
  html_url: string
  sha: string
}

export interface GitHubPullRequest {
  additions: number
  created_at: string
  deletions: number
  html_url: string
  id: number
  merged_at: string | null
  number: number
  state: string
  title: string
  updated_at: string
  user: {
    login: string
  }
}

/** Full PR details from GET /repos/{owner}/{repo}/pulls/{pull_number} */
export interface GitHubPullRequestDetails {
  additions: number
  body: string | null
  changed_files: number
  deletions: number
  head: {
    ref: string
  }
  html_url: string
  labels: Array<{ name: string }>
  number: number
  title: string
}

export interface GitHubEvent {
  created_at: string
  id: string
  payload: {
    action?: string
    commits?: Array<{
      sha: string
      message: string
      url: string
    }>
    pull_request?: {
      number: number
      title: string
      merged: boolean
      merged_at: string | null
      html_url: string
      additions: number
      deletions: number
    }
    review?: {
      state: string
      html_url: string
    }
    ref?: string
    ref_type?: string
  }
  repo: {
    id: number
    name: string
  }
  type: string
}
