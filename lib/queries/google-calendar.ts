import {
  getGoogleCalendarConfigHelpText,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar/oauth'
import {
  getGoogleCalendarEventsForUser,
  getGoogleCalendarStatusForUser,
} from '@/lib/google-calendar/service'
import type {
  GoogleCalendarConnectionStatus,
  GoogleCalendarEvent,
} from '@/lib/google-calendar/types'
import { getSession } from '../auth/session'

export async function getGoogleCalendarStatus(): Promise<GoogleCalendarConnectionStatus> {
  const enabled = isGoogleCalendarConfigured()
  const session = await getSession()
  if (!session?.user) {
    return {
      enabled,
      connected: false,
    }
  }

  return getGoogleCalendarStatusForUser(session.user.id)
}

export async function getGoogleCalendarEventsForDateRange(
  startDate: Date,
  endDate: Date,
): Promise<GoogleCalendarEvent[]> {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  return getGoogleCalendarEventsForUser({
    userId: session.user.id,
    startDate,
    endDate,
  })
}

export function getGoogleCalendarMissingConfigMessage() {
  return getGoogleCalendarConfigHelpText()
}
