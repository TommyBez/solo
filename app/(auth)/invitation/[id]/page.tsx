import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { AcceptInvitationCard } from '@/components/org/accept-invitation-card'
import { invitation, organization, user } from '@/lib/auth/schema'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvitationPage({ params }: Props) {
  const { id } = await params

  const result = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organizationName: organization.name,
      inviterName: user.name,
    })
    .from(invitation)
    .innerJoin(organization, eq(invitation.organizationId, organization.id))
    .innerJoin(user, eq(invitation.inviterId, user.id))
    .where(eq(invitation.id, id))
    .limit(1)

  if (result.length === 0) {
    notFound()
  }

  const inv = result[0]
  const session = await getSession()

  return (
    <AcceptInvitationCard
      currentUserEmail={session?.user?.email ?? null}
      invitation={{
        id: inv.id,
        email: inv.email,
        status: inv.status,
        organizationName: inv.organizationName,
        inviterName: inv.inviterName,
        role: inv.role,
        expiresAt: inv.expiresAt.toISOString(),
      }}
      isLoggedIn={!!session?.user}
    />
  )
}
