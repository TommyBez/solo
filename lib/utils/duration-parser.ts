/**
 * Duration Parser Utility
 *
 * Parses human-readable duration strings into minutes.
 * Supports formats like:
 * - "1h 30m" or "1h30m"
 * - "90m" or "90min"
 * - "1.5h" or "1.5 hours"
 * - "90" (interpreted as minutes)
 * - "1:30" (hours:minutes)
 */

interface ParsedDuration {
  formatted: string
  isValid: boolean
  minutes: number
}

// Regex patterns moved to top level for performance
const COLON_PATTERN = /^(\d+):(\d{1,2})$/
const FULL_PATTERN =
  /^(\d+(?:\.\d+)?)\s*h(?:ours?)?(?:\s*(\d+)\s*m(?:in(?:utes?)?)?)?$/
const MINS_PATTERN = /^(\d+)\s*m(?:in(?:utes?)?)?$/
const HOURS_PATTERN = /^(\d+(?:\.\d+)?)\s*h(?:ours?)?$/
const PLAIN_NUMBER_PATTERN = /^(\d+)$/
const DECIMAL_NUMBER_PATTERN = /^(\d+\.\d+)$/

/**
 * Parse a duration string into minutes
 */
export function parseDuration(input: string): ParsedDuration {
  const trimmed = input.trim().toLowerCase()

  if (!trimmed) {
    return { minutes: 0, isValid: false, formatted: '' }
  }

  // Try different patterns

  // Pattern: "1:30" (hours:minutes)
  const colonMatch = trimmed.match(COLON_PATTERN)
  if (colonMatch) {
    const hours = Number.parseInt(colonMatch[1], 10)
    const mins = Number.parseInt(colonMatch[2], 10)
    if (mins < 60) {
      const total = hours * 60 + mins
      return { minutes: total, isValid: true, formatted: formatDuration(total) }
    }
  }

  // Pattern: "1h 30m" or "1h30m" or "1 h 30 m"
  const fullMatch = trimmed.match(FULL_PATTERN)
  if (fullMatch) {
    const hours = Number.parseFloat(fullMatch[1])
    const mins = fullMatch[2] ? Number.parseInt(fullMatch[2], 10) : 0
    const total = Math.round(hours * 60 + mins)
    return { minutes: total, isValid: true, formatted: formatDuration(total) }
  }

  // Pattern: "30m" or "30 min" or "30 minutes"
  const minsMatch = trimmed.match(MINS_PATTERN)
  if (minsMatch) {
    const mins = Number.parseInt(minsMatch[1], 10)
    return { minutes: mins, isValid: true, formatted: formatDuration(mins) }
  }

  // Pattern: "1.5h" or "1.5 hours"
  const hoursMatch = trimmed.match(HOURS_PATTERN)
  if (hoursMatch) {
    const hours = Number.parseFloat(hoursMatch[1])
    const total = Math.round(hours * 60)
    return { minutes: total, isValid: true, formatted: formatDuration(total) }
  }

  // Pattern: plain number (interpreted as minutes)
  const plainNumber = trimmed.match(PLAIN_NUMBER_PATTERN)
  if (plainNumber) {
    const mins = Number.parseInt(plainNumber[1], 10)
    return { minutes: mins, isValid: true, formatted: formatDuration(mins) }
  }

  // Pattern: decimal number (interpreted as hours)
  const decimalNumber = trimmed.match(DECIMAL_NUMBER_PATTERN)
  if (decimalNumber) {
    const hours = Number.parseFloat(decimalNumber[1])
    const total = Math.round(hours * 60)
    return { minutes: total, isValid: true, formatted: formatDuration(total) }
  }

  return { minutes: 0, isValid: false, formatted: '' }
}

/**
 * Format minutes into a human-readable string
 */
function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) {
    return '0m'
  }

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  if (hours === 0) {
    return `${mins}m`
  }
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}m`
}

/**
 * Format minutes for display in the input field
 */
export function formatDurationForInput(totalMinutes: number): string {
  if (totalMinutes <= 0) {
    return ''
  }

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  if (hours === 0) {
    return `${mins}m`
  }
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}m`
}
