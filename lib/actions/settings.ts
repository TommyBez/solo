'use server'

import { updateTag } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { userSettings } from '@/lib/db/schema'
import type { Settings } from '@/lib/queries/settings'

export async function updateSettings(data: Partial<Settings>) {
  const session = await requireSession()
  const userId = session.user.id

  const now = new Date()

  await db
    .insert(userSettings)
    .values({
      userId,
      companyName: data.companyName,
      companyEmail: data.companyEmail,
      companyPhone: data.companyPhone,
      companyAddress: data.companyAddress,
      dateFormat: data.dateFormat,
      timeFormat: data.timeFormat,
      weekStartsOn: data.weekStartsOn,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        companyName: data.companyName,
        companyEmail: data.companyEmail,
        companyPhone: data.companyPhone,
        companyAddress: data.companyAddress,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        weekStartsOn: data.weekStartsOn,
        updatedAt: now,
      },
    })

  // Immediate cache invalidation - use combined tag
  updateTag(`user-settings-${userId}`)

  return { success: true }
}
