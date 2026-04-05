import { eachDayOfInterval, format, isWeekend, parseISO } from 'date-fns'

export const DATE_KEY_FORMAT = 'yyyy-MM-dd'

export function getDateKey(value: Date | string) {
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value
    }

    return format(new Date(value), DATE_KEY_FORMAT)
  }

  return format(value, DATE_KEY_FORMAT)
}

export function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
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
