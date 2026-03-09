import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { InviteMemberDialog } from '@/components/org/invite-member-dialog'
import { MembersList } from '@/components/org/members-list'
import { OrgGeneralForm } from '@/components/org/org-general-form'
import { OrgSettingsForm } from '@/components/org/org-settings-form'
import { PendingInvitations } from '@/components/org/pending-invitations'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getMemberRole } from '@/lib/auth/permissions'
import { auth } from '@/lib/auth/server'
import { getActiveOrganizationId, requireSession } from '@/lib/auth/session'
import { getOrganizationSettings } from '@/lib/queries/organization-settings'

interface Invitation {
  email: string
  id: string
  role: string | null
  status: string
}

export default function OrgSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your workspace, members, and company information.
        </p>
      </div>

      <Suspense fallback={<OrgSettingsSkeleton />}>
        <OrgSettingsContent />
      </Suspense>
    </div>
  )
}

async function OrgSettingsContent() {
  const session = await requireSession()
  const orgId = await getActiveOrganizationId()

  if (!orgId) {
    redirect('/')
  }

  const role = await getMemberRole(session.user.id, orgId)
  if (!role) {
    redirect('/')
  }

  const orgSettings = await getOrganizationSettings(orgId)

  // Get full organization with members
  const fullOrg = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: orgId },
  })

  const members = fullOrg?.members ?? []
  const invitations = fullOrg?.invitations ?? []

  const canManage = role === 'owner' || role === 'admin'
  const canEditSettings = role === 'owner' || role === 'admin'

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Workspace name and identifier.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrgGeneralForm
            initialName={fullOrg?.name ?? ''}
            initialSlug={fullOrg?.slug ?? ''}
            orgId={orgId}
            readOnly={!canEditSettings}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Details used in invoices and exports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgSettingsForm readOnly={!canEditSettings} settings={orgSettings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? 's' : ''} in this
              workspace.
            </CardDescription>
          </div>
          {canManage && <InviteMemberDialog organizationId={orgId} />}
        </CardHeader>
        <CardContent>
          <MembersList
            currentUserId={session.user.id}
            currentUserRole={role}
            members={
              members as {
                createdAt: Date
                id: string
                role: string
                user: {
                  id: string
                  name: string
                  email: string
                  image?: string | null
                }
              }[]
            }
            orgId={orgId}
          />
        </CardContent>
      </Card>

      {invitations.filter((i: Invitation) => i.status === 'pending').length >
        0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {
                invitations.filter((i: Invitation) => i.status === 'pending')
                  .length
              }{' '}
              pending invitation
              {invitations.filter((i: Invitation) => i.status === 'pending')
                .length !== 1
                ? 's'
                : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PendingInvitations
              canManage={canManage}
              invitations={invitations as Invitation[]}
            />
          </CardContent>
        </Card>
      )}
    </>
  )
}

function OrgSettingsSkeleton() {
  return (
    <>
      {['card-1', 'card-2', 'card-3'].map((key) => (
        <Card key={key}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
