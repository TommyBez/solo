'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { organization } from '@/lib/auth/client'
import type { OrgRole } from '@/lib/auth/permissions'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
  viewer: 'outline',
}

interface Member {
  createdAt: Date
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

export function MembersList({
  members,
  orgId,
  currentUserId,
  currentUserRole,
}: {
  members: Member[]
  orgId: string
  currentUserId: string
  currentUserRole: OrgRole
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const canManageMembers =
    currentUserRole === 'owner' || currentUserRole === 'admin'
  const canChangeRoles = currentUserRole === 'owner'

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setLoading(memberId)
    try {
      const { error } = await organization.updateMemberRole({
        memberId,
        role: newRole as OrgRole,
        organizationId: orgId,
      })
      if (error) {
        toast.error(error.message || 'Failed to update role')
      } else {
        toast.success('Role updated')
        router.refresh()
      }
    } catch {
      toast.error('Failed to update role')
    } finally {
      setLoading(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setLoading(memberId)
    try {
      const { error } = await organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: orgId,
      })
      if (error) {
        toast.error(error.message || 'Failed to remove member')
      } else {
        toast.success('Member removed')
        router.refresh()
      }
    } catch {
      toast.error('Failed to remove member')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          {canManageMembers && (
            <TableHead className="w-[100px]">Actions</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => {
          const isCurrentUser = m.user.id === currentUserId
          const isOwner = m.role === 'owner'

          return (
            <TableRow key={m.id}>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {m.user.name}
                    {isCurrentUser && (
                      <span className="ml-1 text-muted-foreground text-sm">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {m.user.email}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {canChangeRoles && !isOwner && !isCurrentUser ? (
                  <Select
                    disabled={loading === m.id}
                    onValueChange={(value) => handleRoleChange(m.id, value)}
                    value={m.role}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={ROLE_VARIANTS[m.role] ?? 'outline'}>
                    {ROLE_LABELS[m.role] ?? m.role}
                  </Badge>
                )}
              </TableCell>
              {canManageMembers && (
                <TableCell>
                  {!(isCurrentUser || isOwner) && (
                    <Button
                      disabled={loading === m.id}
                      onClick={() => handleRemoveMember(m.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
