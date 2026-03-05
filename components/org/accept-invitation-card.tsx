'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { organization } from '@/lib/auth/client'

interface Props {
  currentUserEmail: string | null
  invitation: {
    id: string
    email: string
    status: string
    organizationName: string
    inviterName: string
    role: string | null
    expiresAt: string
  }
  isLoggedIn: boolean
}

export function AcceptInvitationCard({
  invitation,
  currentUserEmail,
  isLoggedIn,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isExpired = new Date(invitation.expiresAt) < new Date()
  const isAlreadyHandled = invitation.status !== 'pending'
  const emailMatches =
    currentUserEmail?.toLowerCase() === invitation.email.toLowerCase()

  const handleAccept = async () => {
    setLoading(true)
    setError('')
    try {
      const { error: apiError } = await organization.acceptInvitation({
        invitationId: invitation.id,
      })
      if (apiError) {
        setError(apiError.message || 'Failed to accept invitation')
      } else {
        toast.success(`You've joined ${invitation.organizationName}!`)
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Failed to accept invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    setError('')
    try {
      const { error: apiError } = await organization.rejectInvitation({
        invitationId: invitation.id,
      })
      if (apiError) {
        setError(apiError.message || 'Failed to decline invitation')
      } else {
        toast.success('Invitation declined')
        router.push('/')
      }
    } catch {
      setError('Failed to decline invitation')
    } finally {
      setLoading(false)
    }
  }

  if (isExpired || isAlreadyHandled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Invitation {isExpired ? 'Expired' : invitation.status}
          </CardTitle>
          <CardDescription>This invitation is no longer valid.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/">Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (!isLoggedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            <strong>{invitation.inviterName}</strong> invited you to join{' '}
            <strong>{invitation.organizationName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border p-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Email:</span>{' '}
              {invitation.email}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Role:</span>{' '}
              {invitation.role ?? 'member'}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            Sign in or create an account with{' '}
            <strong>{invitation.email}</strong> to accept this invitation.
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={`/sign-in?redirect=/invitation/${invitation.id}`}>
              Sign In
            </Link>
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link href={`/sign-up?redirect=/invitation/${invitation.id}`}>
              Create Account
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (!emailMatches) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Mismatch</CardTitle>
          <CardDescription>
            This invitation was sent to <strong>{invitation.email}</strong>, but
            you're signed in as <strong>{currentUserEmail}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Please sign in with <strong>{invitation.email}</strong> to accept
            this invitation.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href={`/sign-in?redirect=/invitation/${invitation.id}`}>
              Sign in with a different account
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>You're Invited!</CardTitle>
        <CardDescription>
          <strong>{invitation.inviterName}</strong> invited you to join{' '}
          <strong>{invitation.organizationName}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div className="rounded-none border border-destructive/50 bg-destructive/10 p-3 text-destructive text-xs">
            {error}
          </div>
        ) : null}
        <div className="rounded-md border p-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Role:</span>{' '}
            {invitation.role ?? 'member'}
          </p>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button className="flex-1" disabled={loading} onClick={handleAccept}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Accept
        </Button>
        <Button
          className="flex-1"
          disabled={loading}
          onClick={handleReject}
          variant="outline"
        >
          Decline
        </Button>
      </CardFooter>
    </Card>
  )
}
