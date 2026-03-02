'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'solo-timer-state'

interface TimerState {
  accumulatedSeconds: number // Seconds accumulated before pause
  description: string
  isRunning: boolean
  projectId: string
  startTime: number | null // Unix timestamp when timer started
}

const defaultState: TimerState = {
  isRunning: false,
  startTime: null,
  accumulatedSeconds: 0,
  projectId: '',
  description: '',
}

function loadState(): TimerState {
  if (typeof window === 'undefined') {
    return defaultState
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return defaultState
    }
    return JSON.parse(stored) as TimerState
  } catch {
    return defaultState
  }
}

function saveState(state: TimerState) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

function clearState() {
  if (typeof window === 'undefined') {
    return
  }
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
}

export function usePersistedTimer() {
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [projectId, setProjectId] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load state from localStorage on mount
  useEffect(() => {
    const state = loadState()
    setProjectId(state.projectId)
    setDescription(state.description)

    if (state.isRunning && state.startTime) {
      // Calculate elapsed time since timer started
      const now = Date.now()
      const elapsedSinceStart = Math.floor((now - state.startTime) / 1000)
      const totalSeconds = state.accumulatedSeconds + elapsedSinceStart
      setSeconds(totalSeconds)
      setStartTime(new Date(state.startTime))
      setIsRunning(true)
    } else {
      setSeconds(state.accumulatedSeconds)
      if (state.startTime) {
        setStartTime(new Date(state.startTime))
      }
    }
    setIsHydrated(true)
  }, [])

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  // Save state whenever relevant values change
  useEffect(() => {
    if (!isHydrated) {
      return
    }
    const state: TimerState = {
      isRunning,
      startTime: startTime?.getTime() ?? null,
      accumulatedSeconds: isRunning ? 0 : seconds, // When running, we calculate from startTime
      projectId,
      description,
    }
    saveState(state)
  }, [isRunning, seconds, projectId, description, startTime, isHydrated])

  const start = useCallback(() => {
    const now = new Date()
    setStartTime(now)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
    // When pausing, save accumulated seconds
    const state = loadState()
    saveState({
      ...state,
      isRunning: false,
      accumulatedSeconds: seconds,
    })
  }, [seconds])

  const stop = useCallback(() => {
    setIsRunning(false)
    const finalSeconds = seconds
    const finalStartTime = startTime
    // Reset timer state
    setSeconds(0)
    setStartTime(null)
    setDescription('')
    clearState()
    // Return the data needed to create the time entry
    return {
      seconds: finalSeconds,
      startTime: finalStartTime,
      projectId,
      description,
    }
  }, [seconds, startTime, projectId, description])

  const reset = useCallback(() => {
    setIsRunning(false)
    setSeconds(0)
    setStartTime(null)
    setDescription('')
    setProjectId('')
    clearState()
  }, [])

  const updateProjectId = useCallback((id: string) => {
    setProjectId(id)
    // Also save as last used project
    if (id) {
      try {
        localStorage.setItem('solo-last-project', id)
      } catch {
        // Ignore
      }
    }
  }, [])

  const updateDescription = useCallback((desc: string) => {
    setDescription(desc)
  }, [])

  return {
    isRunning,
    seconds,
    projectId,
    description,
    startTime,
    isHydrated,
    start,
    pause,
    stop,
    reset,
    setProjectId: updateProjectId,
    setDescription: updateDescription,
  }
}

// Helper to get last used project
export function getLastUsedProject(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return localStorage.getItem('solo-last-project')
  } catch {
    return null
  }
}

// Helper to get recent projects (stored as array of IDs)
const RECENT_PROJECTS_KEY = 'solo-recent-projects'
const MAX_RECENT_PROJECTS = 5

export function getRecentProjects(): string[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY)
    if (!stored) {
      return []
    }
    return JSON.parse(stored) as string[]
  } catch {
    return []
  }
}

export function addRecentProject(projectId: string) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    const recent = getRecentProjects().filter((id) => id !== projectId)
    recent.unshift(projectId)
    const trimmed = recent.slice(0, MAX_RECENT_PROJECTS)
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(trimmed))
  } catch {
    // Ignore
  }
}
