'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { organization } from '@/lib/auth/client'

interface Invitation {
  email: string
  id: string
  role: string | null
  status: string
}

export function PendingInvitations({
  invitations,
  canManage,
}: {
  invitations: Invitation[]
  canManage: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const pendingInvitations = invitations.filter((i) => i.status === 'pending')

  const handleRevoke = async (invitationId: string) => {
    setLoading(invitationId)
    try {
      const { error } = await organization.cancelInvitation({
        invitationId,
      })
      if (error) {
        toast.error(error.message || 'Failed to revoke invitation')
      } else {
        toast.success('Invitation revoked')
        router.refresh()
      }
    } catch {
      toast.error('Failed to revoke invitation')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      {pendingInvitations.map((inv) => (
        <div
          className="flex items-center justify-between rounded-md border p-3"
          key={inv.id}
        >
          <div>
            <p className="font-medium text-sm">{inv.email}</p>
            <p className="text-muted-foreground text-xs">
              Role: {inv.role ?? 'member'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-xs">Pending</p>
            {canManage && (
              <Button
                disabled={loading === inv.id}
                onClick={() => handleRevoke(inv.id)}
                size="sm"
                variant="ghost"
              >
                {loading === inv.id ? 'Revoking...' : 'Revoke'}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
