import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
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

// Request-scoped cache: resolves the org ID once per request,
// including the case where ensureActiveOrganization() just set it
// but the cookie hasn't round-tripped yet.
const resolveOrganizationId = cache(
  async (): Promise<string | null> => {
    const session = await getSession()
    if (!session?.user) {
      return null
    }

    const orgId = (session?.session as { activeOrganizationId?: string })
      ?.activeOrganizationId
    if (orgId) {
      return orgId
    }

    // No active org in cookie — find user's first membership
    const firstMembership = await db.query.member.findFirst({
      where: eq(member.userId, session.user.id),
    })
    if (!firstMembership) {
      return null
    }

    // Set it for future requests (updates DB + response cookie)
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId: firstMembership.organizationId },
    })

    // Return the org ID directly so this request sees it immediately
    return firstMembership.organizationId
  },
)

export async function getActiveOrganizationId(): Promise<string | null> {
  return resolveOrganizationId()
}

export async function requireOrganization() {
  const session = await requireSession()
  const organizationId = await getActiveOrganizationId()
  if (!organizationId) {
    throw new Error('No active organization')
  }
  return { session, organizationId }
}

export async function ensureActiveOrganization(): Promise<void> {
  const orgId = await resolveOrganizationId()
  if (!orgId) {
    redirect('/onboarding')
  }
}
