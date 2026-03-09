'use server'

import { revalidateTag } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { disconnectGoogleCalendarForUser } from '@/lib/google-calendar/service'

export async function disconnectGoogleCalendar() {
  const session = await requireSession()
  await disconnectGoogleCalendarForUser(session.user.id)
  revalidateTag('google-calendar', 'max')
}
