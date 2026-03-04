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
import { useTransition } from 'react'
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

const callbackMessages: Record<string, { message: string; ok: boolean }> = {
  connected: { message: 'Google Calendar connected successfully.', ok: true },
  'connect-failed': {
    message: 'Google Calendar connection failed. Please try again.',
    ok: false,
  },
  'invalid-state': {
    message: 'Connection could not be validated. Please try again.',
    ok: false,
  },
  unauthorized: {
    message: 'Please sign in again to connect Google Calendar.',
    ok: false,
  },
}

interface GoogleCalendarCardProps {
  callbackStatus?: string
  status: GoogleCalendarConnectionStatus
}

export function GoogleCalendarCard({
  status,
  callbackStatus,
}: GoogleCalendarCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const callback = callbackStatus
    ? callbackMessages[callbackStatus]
    : undefined

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

        {!status.connected ? (
          <Button asChild disabled={!status.enabled}>
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
