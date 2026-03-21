import type { SuggestionType } from './schemas'

// Generate a suggestion hash for deduplication
export function generateSuggestionHash(params: {
  type: SuggestionType
  sourceId: string
  date: string
}): string {
  return `${params.type}:${params.sourceId}:${params.date}`
}

// Check if a calendar event overlaps with a time entry
export function eventsOverlap(
  event: { startTime: Date; endTime: Date },
  entry: { startTime: Date; endTime: Date | null }
): boolean {
  const eventStart = event.startTime.getTime()
  const eventEnd = event.endTime.getTime()
  const entryStart = entry.startTime.getTime()
  const entryEnd = entry.endTime?.getTime() ?? entryStart + 60 * 60 * 1000 // Default 1 hour

  return eventStart < entryEnd && eventEnd > entryStart
}

// Format duration in minutes to human readable
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
