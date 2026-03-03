'use client'

import { format } from 'date-fns'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useOptimistic,
  useRef,
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
  const [optimisticSettings, addOptimisticSettings] = useOptimistic(
    settings,
    (currentSettings: Settings, updates: Partial<Settings>) => ({
      ...currentSettings,
      ...updates,
    }),
  )
  const [isPending, startTransition] = useTransition()
  const latestUpdateId = useRef(0)

  const formatDate = useCallback(
    (date: Date | string, formatStr?: string) => {
      const d = typeof date === 'string' ? new Date(date) : date
      const fmt = formatStr ?? optimisticSettings.dateFormat
      return format(d, fmt)
    },
    [optimisticSettings.dateFormat],
  )

  const formatTime = useCallback(
    (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date
      const fmt = optimisticSettings.timeFormat === '24' ? 'HH:mm' : 'h:mm a'
      return format(d, fmt)
    },
    [optimisticSettings.timeFormat],
  )

  const updateSettings = useCallback(
    (updates: Partial<Settings>) => {
      const previousSettings = settings
      const updateId = ++latestUpdateId.current

      // Server update in transition
      return new Promise<void>((resolve) => {
        startTransition(() => {
          addOptimisticSettings(updates)
          updateSettingsAction(updates)
            .then(() => {
              setSettings((currentSettings) => ({
                ...currentSettings,
                ...updates,
              }))
            })
            .catch(() => {
              // Only revert if this is still the latest in-flight update.
              if (updateId === latestUpdateId.current) {
                setSettings(previousSettings)
              }
            })
            .finally(() => {
              resolve()
            })
        })
      })
    },
    [addOptimisticSettings, settings],
  )

  const value = useMemo(
    () => ({
      settings: optimisticSettings,
      formatDate,
      formatTime,
      updateSettings,
      isPending,
    }),
    [optimisticSettings, formatDate, formatTime, updateSettings, isPending],
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
