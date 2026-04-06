import { eachDayOfInterval, format, isWeekend, parseISO } from 'date-fns'

export const DATE_KEY_FORMAT = 'yyyy-MM-dd'
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function getDateKey(value: Date | string) {
  if (typeof value === 'string') {
    if (DATE_KEY_REGEX.test(value)) {
      return value
    }

    return format(new Date(value), DATE_KEY_FORMAT)
  }

  return format(value, DATE_KEY_FORMAT)
}

export function isDateKey(value: string) {
  return DATE_KEY_REGEX.test(value)
}

/** Calendar day as yyyy-MM-dd in UTC — stable across server timezones for `Date` values. */
export function getUtcDateKey(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function countWeekdaysInRange(startDate: Date, endDate: Date) {
  return eachDayOfInterval({ start: startDate, end: endDate }).filter(
    (day) => !isWeekend(day),
  ).length
}

export function countWeekdayDateKeys(dateKeys: string[]) {
  return dateKeys.filter((dateKey) => !isWeekend(parseISO(dateKey))).length
}

export function getAdjustedExpectedHours(
  baseHours: number,
  outOfOfficeDateKeys: string[],
  startDate: Date,
  endDate: Date,
) {
  const weekdayCount = countWeekdaysInRange(startDate, endDate)

  if (weekdayCount === 0) {
    return baseHours
  }

  const weekdayOutOfOfficeCount = Math.min(
    countWeekdayDateKeys(outOfOfficeDateKeys),
    weekdayCount,
  )

  const adjustedHours =
    baseHours * ((weekdayCount - weekdayOutOfOfficeCount) / weekdayCount)

  return Math.round(adjustedHours * 10) / 10
}
