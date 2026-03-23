export const GITHUB_PROVIDER_ID = 'github'

export interface GitHubConnectionStatus {
  connected: boolean
  connectedUsername?: string
  enabled: boolean
}

export interface GitHubTokenPayload {
  accessToken: string
  tokenType: string
  scope: string
}

export interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

export interface GitHubActivity {
  id: string
  type: 'commit' | 'pr_merged' | 'pr_opened' | 'review'
  description: string
  repoName: string
  repoFullName: string
  timestamp: string
  url: string
  metadata: {
    commitSha?: string
    commitMessage?: string
    prNumber?: number
    prTitle?: string
    additions?: number
    deletions?: number
    reviewState?: string
  }
}

export interface GitHubCommit {
  sha: string
  commit: {
    author: {
      name: string
      email: string
      date: string
    }
    message: string
  }
  html_url: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  state: string
  merged_at: string | null
  created_at: string
  updated_at: string
  html_url: string
  additions: number
  deletions: number
  user: {
    login: string
  }
}

export interface GitHubEvent {
  id: string
  type: string
  created_at: string
  repo: {
    id: number
    name: string
  }
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
}
