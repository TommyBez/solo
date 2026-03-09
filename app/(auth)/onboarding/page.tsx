import { and, eq } from 'drizzle-orm'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { CreateOrgForm } from '@/components/org/create-org-form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { invitation, member, organization, user } from '@/lib/auth/schema'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  )
}

async function OnboardingContent() {
  const session = await requireSession()

  // Check if user already has an org — if so, redirect to their workspace
  const membership = await db.query.member.findFirst({
    where: eq(member.userId, session.user.id),
    columns: { organizationId: true },
  })
  if (membership) {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, membership.organizationId),
      columns: { slug: true },
    })
    redirect(org ? `/${org.slug}` : '/')
  }

  // Fetch pending invitations for this user's email
  const pendingInvitations = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      organizationName: organization.name,
      inviterName: user.name,
    })
    .from(invitation)
    .innerJoin(organization, eq(invitation.organizationId, organization.id))
    .innerJoin(user, eq(invitation.inviterId, user.id))
    .where(
      and(
        eq(invitation.email, session.user.email),
        eq(invitation.status, 'pending'),
      ),
    )

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="font-bold text-2xl tracking-tight">Welcome to Solo</h1>
        <p className="text-muted-foreground text-sm">
          {pendingInvitations.length > 0
            ? 'You have pending invitations, or you can create a new workspace.'
            : 'Create a workspace to get started.'}
        </p>
      </div>

      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations</CardTitle>
            <CardDescription>
              Accept an invitation to join an existing workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div
                className="flex items-center justify-between rounded-md border p-3"
                key={inv.id}
              >
                <div>
                  <p className="font-medium text-sm">{inv.organizationName}</p>
                  <p className="text-muted-foreground text-xs">
                    Invited by {inv.inviterName} as {inv.role ?? 'member'}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/invitation/${inv.id}`}>View</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create Workspace</CardTitle>
          <CardDescription>
            Start a new workspace for your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrgForm showCancel={false} />
        </CardContent>
      </Card>
    </div>
  )
}
