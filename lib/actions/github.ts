'use server'

import { revalidateTag } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { disconnectGitHubForUser } from '@/lib/github/service'

export async function disconnectGitHub() {
  const session = await requireSession()
  await disconnectGitHubForUser(session.user.id)
  revalidateTag('github-status', 'max')
  revalidateTag('ai-suggestions', 'max')
}
