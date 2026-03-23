'use client'

import { CheckCircle2, CircleAlert, Github, Link2, Link2Off } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { disconnectGitHub } from '@/lib/actions/github'
import type { GitHubConnectionStatus } from '@/lib/github/types'
import { Button } from '../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'

const callbackMessages: Record<string, { message: string; ok: boolean }> = {
  connected: { message: 'GitHub connected successfully.', ok: true },
  'connect-failed': {
    message: 'GitHub connection failed. Please try again.',
    ok: false,
  },
  'invalid-state': {
    message: 'Connection could not be validated. Please try again.',
    ok: false,
  },
  unauthorized: {
    message: 'Please sign in again to connect GitHub.',
    ok: false,
  },
  'missing-config': {
    message: 'GitHub integration is not configured.',
    ok: false,
  },
}

interface GitHubCardProps {
  callbackStatus?: string
  status: GitHubConnectionStatus
}

export function GitHubCard({ status, callbackStatus }: GitHubCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const callback = callbackStatus ? callbackMessages[callbackStatus] : undefined

  function handleDisconnect() {
    startTransition(() => {
      disconnectGitHub()
        .then(() => {
          toast.success('GitHub disconnected')
          router.refresh()
        })
        .catch(() => {
          toast.error('Failed to disconnect GitHub')
        })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="size-5" />
          GitHub
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to generate AI time entry suggestions from
          your commits, pull requests, and code reviews.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {callback ? (
          <p className="flex items-center gap-2 text-sm">
            {callback.ok ? (
              <CheckCircle2 className="size-4 text-green-600" />
            ) : (
              <CircleAlert className="size-4 text-destructive" />
            )}
            {callback.message}
          </p>
        ) : null}

        {status.connected ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Connected as{' '}
              <span className="font-medium">@{status.connectedUsername}</span>
            </p>
            <Button
              disabled={isPending}
              onClick={handleDisconnect}
              variant="outline"
            >
              <Link2Off className="mr-2 size-4" />
              {isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>
        ) : null}

        {status.connected ? null : (
          <Button asChild disabled={!status.enabled}>
            <Link href="/api/github/connect">
              <Link2 className="mr-2 size-4" />
              Connect GitHub
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
