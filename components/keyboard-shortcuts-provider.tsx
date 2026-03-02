'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  emitShortcutEvent,
  SHORTCUT_EVENTS,
  useKeyboardShortcuts,
} from '@/lib/hooks/use-keyboard-shortcuts'

interface KeyboardShortcutsProviderProps {
  children: ReactNode
}

export function KeyboardShortcutsProvider({
  children,
}: KeyboardShortcutsProviderProps) {
  const pathname = usePathname()

  // Only enable time-related shortcuts on the time page
  const isTimePage = pathname === '/time'

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 't',
        ctrl: true,
        handler: () => emitShortcutEvent(SHORTCUT_EVENTS.TOGGLE_TIMER),
        description: 'Toggle timer (start/pause)',
      },
      {
        key: 'n',
        ctrl: true,
        handler: () => emitShortcutEvent(SHORTCUT_EVENTS.NEW_ENTRY),
        description: 'Add new time entry',
      },
    ],
    enabled: isTimePage,
  })

  return <>{children}</>
}
