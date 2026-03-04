import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { member } from './schema'
import { auth } from './server'

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
}

export async function requireSession() {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function getActiveOrganizationId(): Promise<string | null> {
  const session = await getSession()
  return (
    (session?.session as { activeOrganizationId?: string })
      ?.activeOrganizationId ?? null
  )
}

export async function requireOrganization() {
  const session = await requireSession()
  const organizationId = (session.session as { activeOrganizationId?: string })
    ?.activeOrganizationId
  if (!organizationId) {
    throw new Error('No active organization')
  }
  return { session, organizationId }
}

export async function ensureActiveOrganization(): Promise<void> {
  const session = await getSession()
  if (!session?.user) {
    return
  }

  const activeOrgId = (session.session as { activeOrganizationId?: string })
    ?.activeOrganizationId
  if (activeOrgId) {
    return
  }

  // No active org — find user's first membership and set it
  const firstMembership = await db.query.member.findFirst({
    where: eq(member.userId, session.user.id),
  })
  if (!firstMembership) {
    return
  }

  await auth.api.setActiveOrganization({
    headers: await headers(),
    body: { organizationId: firstMembership.organizationId },
  })
}
