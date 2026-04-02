import 'server-only'
import { isAiFeaturesEnabled } from '@/flags'
import { requireSession } from '@/lib/auth/session'
import { getSettings } from '@/lib/queries/settings'

export async function getAiFeatureAvailability() {
  const session = await requireSession()
  const allowed = await isAiFeaturesEnabled()

  return {
    allowed,
    session,
  }
}

export function getEffectiveAiSettings<T extends { aiEnabled: boolean }>(
  settings: T,
  allowed: boolean,
): T {
  return {
    ...settings,
    aiEnabled: allowed && settings.aiEnabled,
  }
}

export async function isAiAvailableForUser(userId: string) {
  const [allowed, settings] = await Promise.all([
    isAiFeaturesEnabled(),
    getSettings(userId),
  ])

  return allowed && settings.aiEnabled
}

export async function isAiAvailableForCurrentUser() {
  const session = await requireSession()
  const [flagEnabled, settings] = await Promise.all([
    isAiFeaturesEnabled(),
    getSettings(session.user.id),
  ])

  return {
    flagEnabled,
    settings,
    session,
    enabled: flagEnabled && settings.aiEnabled,
  }
}

export async function requireAiAccess() {
  const access = await isAiAvailableForCurrentUser()

  if (!access.enabled) {
    throw new Error('AI features are not enabled for this account')
  }

  return access
}
