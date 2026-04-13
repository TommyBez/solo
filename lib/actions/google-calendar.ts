'use server'

import { revalidateTag } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import {
  disconnectAllGoogleCalendarAccounts,
  disconnectGoogleCalendarAccount,
} from '@/lib/google-calendar/service'

export async function disconnectGoogleCalendar(accountId?: string) {
  const session = await requireSession()
  if (accountId) {
    await disconnectGoogleCalendarAccount(session.user.id, accountId)
  } else {
    await disconnectAllGoogleCalendarAccounts(session.user.id)
  }
  revalidateTag('google-calendar', 'max')
}
