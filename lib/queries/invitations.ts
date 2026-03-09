import { and, eq, gt } from 'drizzle-orm'
import { invitation, organization, user } from '@/lib/auth/schema'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export interface PendingInvitation {
  id: string
  inviterName: string
  organizationName: string
  role: string
}

export async function getPendingInvitationsForUser(): Promise<
  PendingInvitation[]
> {
  const session = await getSession()
  if (!session?.user?.email) {
    return []
  }

  const rows = await db
    .select({
      id: invitation.id,
      organizationName: organization.name,
      inviterName: user.name,
      role: invitation.role,
    })
    .from(invitation)
    .innerJoin(organization, eq(invitation.organizationId, organization.id))
    .innerJoin(user, eq(invitation.inviterId, user.id))
    .where(
      and(
        eq(invitation.email, session.user.email),
        eq(invitation.status, 'pending'),
        gt(invitation.expiresAt, new Date()),
      ),
    )

  return rows.map((row) => ({
    ...row,
    role: row.role ?? 'member',
  }))
}
