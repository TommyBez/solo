import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { member } from './schema'

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
}

export async function getMemberRole(
  userId: string,
  organizationId: string,
): Promise<OrgRole | null> {
  const m = await db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, organizationId),
    ),
  })
  return (m?.role as OrgRole) ?? null
}

export async function requireRole(
  userId: string,
  organizationId: string,
  minimumRole: OrgRole,
) {
  const role = await getMemberRole(userId, organizationId)
  if (!role) {
    throw new Error('Not a member of this organization')
  }
  if (ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minimumRole]) {
    throw new Error('Insufficient permissions')
  }
  return role
}

export function canMutateData(role: OrgRole): boolean {
  return role !== 'viewer'
}
