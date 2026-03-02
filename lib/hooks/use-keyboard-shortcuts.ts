'use client'

import { useCallback, useEffect } from 'react'

interface KeyboardShortcut {
  alt?: boolean
  ctrl?: boolean
  description?: string
  handler: () => void
  key: string
  meta?: boolean
  shift?: boolean
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  shortcuts: KeyboardShortcut[]
}

function isInputElement(target: HTMLElement): boolean {
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  )
}

function doesShortcutMatch(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut,
): boolean {
  const ctrlOrMeta = shortcut.ctrl || shortcut.meta
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
  const ctrlMatches = ctrlOrMeta
    ? event.ctrlKey || event.metaKey
    : !(event.ctrlKey || event.metaKey)
  const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey
  const altMatches = shortcut.alt ? event.altKey : !event.altKey

  return keyMatches && ctrlMatches && shiftMatches && altMatches
}

/**
 * Hook to register global keyboard shortcuts
 *
 * Example:
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 't', ctrl: true, handler: () => console.log('Toggle timer') },
 *     { key: 'n', ctrl: true, handler: () => console.log('New entry') },
 *   ]
 * })
 * ```
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return
      }

      const target = event.target as HTMLElement
      const isInput = isInputElement(target)

      for (const shortcut of shortcuts) {
        if (!doesShortcutMatch(event, shortcut)) {
          continue
        }

        const ctrlOrMeta = shortcut.ctrl || shortcut.meta
        // Allow shortcuts in input fields only if ctrl/meta is pressed
        if (isInput && !ctrlOrMeta) {
          continue
        }

        event.preventDefault()
        shortcut.handler()
        return
      }
    },
    [shortcuts, enabled],
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}

/**
 * Custom event types for keyboard shortcuts to communicate between components
 */
export const SHORTCUT_EVENTS = {
  TOGGLE_TIMER: 'shortcut:toggle-timer',
  NEW_ENTRY: 'shortcut:new-entry',
  QUICK_SEARCH: 'shortcut:quick-search',
} as const

/**
 * Emit a shortcut event
 */
export function emitShortcutEvent(eventName: string) {
  window.dispatchEvent(new CustomEvent(eventName))
}

/**
 * Hook to listen for shortcut events
 */
export function useShortcutEvent(
  eventName: string,
  handler: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const listener = () => handler()
    window.addEventListener(eventName, listener)
    return () => window.removeEventListener(eventName, listener)
  }, [eventName, handler, enabled])
}
