'use client'

import { format } from 'date-fns'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from 'react'
import { updateSettings as updateSettingsAction } from '@/lib/actions/settings'
import type { Settings } from '@/lib/queries/settings'

export interface SettingsContextValue {
  formatDate: (date: Date | string, formatStr?: string) => string
  formatTime: (date: Date | string) => string
  isPending: boolean
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

interface SettingsProviderProps {
  children: ReactNode
  initialSettings: Settings
}

export function SettingsProvider({
  children,
  initialSettings,
}: SettingsProviderProps) {
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [isPending, startTransition] = useTransition()

  const formatDate = useCallback(
    (date: Date | string, formatStr?: string) => {
      const d = typeof date === 'string' ? new Date(date) : date
      const fmt = formatStr ?? settings.dateFormat
      return format(d, fmt)
    },
    [settings.dateFormat],
  )

  const formatTime = useCallback(
    (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date
      const fmt = settings.timeFormat === '24' ? 'HH:mm' : 'h:mm a'
      return format(d, fmt)
    },
    [settings.timeFormat],
  )

  const updateSettings = useCallback(
    (updates: Partial<Settings>) => {
      const newSettings = { ...settings, ...updates }

      // Optimistic update
      setSettings(newSettings)

      // Server update in transition
      startTransition(() => {
        updateSettingsAction(updates).catch(() => {
          // Revert on error
          setSettings(settings)
        })
      })
    },
    [settings],
  )

  const value = useMemo(
    () => ({
      settings,
      formatDate,
      formatTime,
      updateSettings,
      isPending,
    }),
    [settings, formatDate, formatTime, updateSettings, isPending],
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider')
  }
  return context
}
