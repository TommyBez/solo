import { eq } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { isAiFeaturesEnabled } from '@/flags'
import { db } from '@/lib/db'
import { userSettings } from '@/lib/db/schema'

export type { UserSettings } from '@/lib/db/schema'

export interface Settings {
  aiEnabled: boolean
  companyAddress: string
  companyEmail: string
  companyName: string
  companyPhone: string
  dateFormat: string
  timeFormat: '12' | '24'
  weekStartsOn: '0' | '1'
}

const defaultSettings: Settings = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  weekStartsOn: '1',
  dateFormat: 'MMM d, yyyy',
  timeFormat: '12',
  aiEnabled: true,
}

export async function getSettings(userId: string): Promise<Settings> {
  'use cache'
  cacheTag(`user-settings-${userId}`)
  cacheLife('hours')

  const aiFlagEnabled = await isAiFeaturesEnabled()
  const result = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .then((rows) => rows[0])

  if (!result) {
    return {
      ...defaultSettings,
      aiEnabled: aiFlagEnabled && defaultSettings.aiEnabled,
    }
  }

  return {
    companyName: result.companyName ?? defaultSettings.companyName,
    companyEmail: result.companyEmail ?? defaultSettings.companyEmail,
    companyPhone: result.companyPhone ?? defaultSettings.companyPhone,
    companyAddress: result.companyAddress ?? defaultSettings.companyAddress,
    dateFormat: result.dateFormat,
    timeFormat:
      (result.timeFormat as '12' | '24') ?? defaultSettings.timeFormat,
    weekStartsOn:
      (result.weekStartsOn as '0' | '1') ?? defaultSettings.weekStartsOn,
    aiEnabled: aiFlagEnabled && (result.aiEnabled ?? defaultSettings.aiEnabled),
  }
}

export { defaultSettings }
