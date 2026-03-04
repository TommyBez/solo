'use client'

import { CalendarClock, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const DISMISS_KEY = 'solo:gcal-banner-dismissed'

export function GoogleCalendarBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) !== 'true') {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <CalendarClock className="size-4 shrink-0" />
        <p>
          Connect Google Calendar to view events alongside your tracked time.{' '}
          <Link
            className="text-primary underline underline-offset-4 hover:text-primary/80"
            href="/settings"
          >
            Set up in Settings
          </Link>
        </p>
      </div>
      <button
        className="shrink-0 rounded-md p-1 text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, 'true')
          setVisible(false)
        }}
        type="button"
      >
        <X className="size-4" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  )
}
