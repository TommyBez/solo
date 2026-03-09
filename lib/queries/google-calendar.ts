import { cacheLife, cacheTag } from 'next/cache'
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

async function getGoogleCalendarStatusCached(
  userId: string,
): Promise<GoogleCalendarConnectionStatus> {
  'use cache'
  cacheLife('minutes')
  cacheTag('google-calendar')
  return await getGoogleCalendarStatusForUser(userId)
}

export async function getGoogleCalendarStatus(): Promise<GoogleCalendarConnectionStatus> {
  const enabled = isGoogleCalendarConfigured()
  const session = await getSession()
  if (!session?.user) {
    return {
      enabled,
      connected: false,
    }
  }

  return getGoogleCalendarStatusCached(session.user.id)
}

async function getGoogleCalendarEventsCached(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<GoogleCalendarEvent[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag('google-calendar')
  return await getGoogleCalendarEventsForUser({
    userId,
    startDate,
    endDate,
  })
}

export async function getGoogleCalendarEventsForDateRange(
  startDate: Date,
  endDate: Date,
): Promise<GoogleCalendarEvent[]> {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  return getGoogleCalendarEventsCached(session.user.id, startDate, endDate)
}

export function getGoogleCalendarMissingConfigMessage() {
  return getGoogleCalendarConfigHelpText()
}
