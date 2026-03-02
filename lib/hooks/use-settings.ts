'use client'

import { useCallback, useEffect, useState } from 'react'

export interface Settings {
  companyAddress: string
  companyEmail: string
  companyName: string
  companyPhone: string
  dateFormat: string
  timeFormat: '12' | '24'
  weekStartsOn: '0' | '1' // 0 = Sunday, 1 = Monday
}

const defaultSettings: Settings = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  weekStartsOn: '1',
  dateFormat: 'MMM d, yyyy',
  timeFormat: '12',
}

const SETTINGS_KEY = 'solo-settings'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Settings>
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch {
      // Ignore parse errors
    }
    setIsHydrated(true)
  }, [])

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates }
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
      } catch {
        // Ignore storage errors
      }
      return newSettings
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    try {
      localStorage.removeItem(SETTINGS_KEY)
    } catch {
      // Ignore storage errors
    }
  }, [])

  return {
    settings,
    isHydrated,
    updateSettings,
    resetSettings,
  }
}
