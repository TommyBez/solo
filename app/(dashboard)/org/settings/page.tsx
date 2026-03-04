import { redirect } from 'next/navigation'
import { getMemberRole } from '@/lib/auth/permissions'
import { getActiveOrganizationId, requireSession } from '@/lib/auth/session'
import { getOrganizationSettings } from '@/lib/queries/organization-settings'
import { InviteMemberDialog } from '@/components/org/invite-member-dialog'
import { MembersList } from '@/components/org/members-list'
import { OrgGeneralForm } from '@/components/org/org-general-form'
import { OrgSettingsForm } from '@/components/org/org-settings-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { auth } from '@/lib/auth/server'
import { headers } from 'next/headers'

export default async function OrgSettingsPage() {
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your workspace, members, and company information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Workspace name and identifier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgGeneralForm
            orgId={orgId}
            initialName={fullOrg?.name ?? ''}
            initialSlug={fullOrg?.slug ?? ''}
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
          <OrgSettingsForm
            settings={orgSettings}
            readOnly={!canEditSettings}
          />
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
          {canManage && <InviteMemberDialog />}
        </CardHeader>
        <CardContent>
          <MembersList
            members={members as any}
            orgId={orgId}
            currentUserId={session.user.id}
            currentUserRole={role}
          />
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {invitations.filter((i: any) => i.status === 'pending').length}{' '}
              pending invitation
              {invitations.filter((i: any) => i.status === 'pending').length !== 1
                ? 's'
                : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations
                .filter((i: any) => i.status === 'pending')
                .map((inv: any) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{inv.email}</p>
                      <p className="text-muted-foreground text-xs">
                        Role: {inv.role ?? 'member'}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-xs">Pending</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
