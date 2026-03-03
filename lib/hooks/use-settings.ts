'use client'

export type {
  SettingsContextValue,
  useSettingsContext,
} from '@/lib/context/settings-context'
export type { Settings } from '@/lib/queries/settings'

import { useSettingsContext } from '@/lib/context/settings-context'
import type { Settings } from '@/lib/queries/settings'

interface UseSettingsReturn {
  isHydrated: boolean
  resetSettings: () => void
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
}

export function useSettings(): UseSettingsReturn {
  const { settings, updateSettings } = useSettingsContext()

  // resetSettings reverts to defaults via the server
  const resetSettings = () => {
    updateSettings({
      companyName: '',
      companyEmail: '',
      companyPhone: '',
      companyAddress: '',
      weekStartsOn: '1',
      dateFormat: 'MMM d, yyyy',
      timeFormat: '12',
    })
  }

  return {
    settings,
    isHydrated: true, // Always hydrated since data comes from server
    updateSettings,
    resetSettings,
  }
}
