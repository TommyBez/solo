import { cacheLife, cacheTag } from 'next/cache'
import { getSession } from '@/lib/auth/session'
import { getGitHubStatusForUser } from '@/lib/github/service'
import type { GitHubConnectionStatus } from '@/lib/github/types'

async function getGitHubStatusCached(
  userId: string,
): Promise<GitHubConnectionStatus> {
  'use cache'
  cacheLife('minutes')
  cacheTag('github-status')

  return await getGitHubStatusForUser(userId)
}

export async function getGitHubStatus(): Promise<GitHubConnectionStatus> {
  const session = await getSession()
  if (!session?.user) {
    return { enabled: false, connected: false }
  }
  return getGitHubStatusCached(session.user.id)
}
