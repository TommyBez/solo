'use client'

import { useCallback, useEffect, useState } from 'react'

export type Settings = {
  // Company Information
  companyName: string
  companyEmail: string
  companyPhone: string
  companyAddress: string

  // Invoice Defaults
  defaultCurrency: string
  defaultTaxRate: string
  paymentTerms: string
  invoiceNotes: string

  // Display Preferences
  weekStartsOn: '0' | '1' // 0 = Sunday, 1 = Monday
  dateFormat: string
  timeFormat: '12' | '24'
}

const defaultSettings: Settings = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  defaultCurrency: 'USD',
  defaultTaxRate: '0',
  paymentTerms: 'Due within 30 days',
  invoiceNotes: 'Thank you for your business!',
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

// Helper to get settings outside of React (for server components)
export function getStoredSettings(): Settings {
  if (typeof window === 'undefined') {
    return defaultSettings
  }
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch {
    // Ignore parse errors
  }
  return defaultSettings
}
