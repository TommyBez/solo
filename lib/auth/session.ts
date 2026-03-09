import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { db } from '@/lib/db'
import { member, organization } from './schema'
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
const resolveOrganizationId = cache(async (): Promise<string | null> => {
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
})

export function getActiveOrganizationId(): Promise<string | null> {
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

// Resolves the active org's slug from the session.
// Request-scoped via cache() — safe to call multiple times per request.
export const getActiveOrganizationSlug = cache(
  async (): Promise<string | null> => {
    const orgId = await getActiveOrganizationId()
    if (!orgId) {
      return null
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
      columns: { slug: true },
    })
    return org?.slug ?? null
  },
)

// Given a slug, resolves it to an org ID. Used by the proxy.
export async function resolveOrgIdFromSlug(
  slug: string,
): Promise<string | null> {
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
    columns: { id: true },
  })
  return org?.id ?? null
}
