import { Mail } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getPendingInvitationsForUser } from '@/lib/queries/invitations'

export async function PendingInvitationBanner() {
  const invitations = await getPendingInvitationsForUser()

  if (invitations.length === 0) {
    return null
  }

  return (
    <div className="px-4 pt-3 md:px-6">
      {invitations.map((inv) => (
        <Alert className="border-primary/20 bg-primary/5" key={inv.id}>
          <Mail className="size-4 text-primary" />
          <AlertTitle>
            You've been invited to join <strong>{inv.organizationName}</strong>
          </AlertTitle>
          <AlertDescription className="flex items-center gap-3">
            <span>
              Role: {inv.role} &middot; Invited by {inv.inviterName}
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href={`/invitation/${inv.id}`}>View Invitation</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
