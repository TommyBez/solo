'use client'

import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Link2,
  Link2Off,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useTransition } from 'react'
import { toast } from 'sonner'
import { disconnectGoogleCalendar } from '@/lib/actions/google-calendar'
import type { GoogleCalendarConnectionStatus } from '@/lib/google-calendar/types'
import { Button } from '../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'

interface GoogleCalendarConnectionCardProps {
  callbackStatus?: string
  missingConfigMessage: string
  status: GoogleCalendarConnectionStatus
}

const callbackMessageByStatus: Record<string, string> = {
  connected: 'Google Calendar connected successfully.',
  'connect-failed': 'Google Calendar connection failed. Please try again.',
  'invalid-state': 'Connection could not be validated. Please try again.',
  unauthorized: 'Please sign in again to connect Google Calendar.',
}

export function GoogleCalendarConnectionCard({
  status,
  callbackStatus,
  missingConfigMessage,
}: GoogleCalendarConnectionCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const callbackMessage = useMemo(
    () =>
      callbackStatus ? callbackMessageByStatus[callbackStatus] : undefined,
    [callbackStatus],
  )

  const handleDisconnect = () => {
    startTransition(() => {
      disconnectGoogleCalendar()
        .then(() => {
          toast.success('Google Calendar disconnected')
          router.refresh()
        })
        .catch(() => {
          toast.error('Failed to disconnect Google Calendar')
        })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Connect your calendar to view events alongside tracked time and turn
          events into time entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {callbackMessage ? (
          <p className="flex items-center gap-2 text-sm">
            {callbackStatus === 'connected' ? (
              <CheckCircle2 className="size-4 text-green-600" />
            ) : (
              <CircleAlert className="size-4 text-destructive" />
            )}
            {callbackMessage}
          </p>
        ) : null}

        {status.enabled ? null : (
          <>
            <p className="text-muted-foreground text-sm">
              Google Calendar is not configured for this environment.
            </p>
            <p className="font-mono text-muted-foreground text-xs">
              {missingConfigMessage}
            </p>
            <Button disabled variant="outline">
              <Link2 className="mr-2 size-4" />
              Connect Google Calendar
            </Button>
          </>
        )}

        {status.enabled && status.connected ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Connected as{' '}
              <span className="font-medium">{status.connectedEmail}</span>
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

        {status.enabled && !status.connected ? (
          <Button asChild>
            <Link href="/api/google-calendar/connect">
              <Link2 className="mr-2 size-4" />
              Connect Google Calendar
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
