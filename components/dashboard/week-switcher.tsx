'use client'

import { endOfWeek, format, startOfWeek, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { Button } from '@/components/ui/button'
import { useSettingsContext } from '@/lib/context/settings-context'
import { dashboardSearchParams } from '@/lib/search-params'

export function WeekSwitcher() {
  const [weekOffset, setWeekOffset] = useQueryState('week', {
    ...dashboardSearchParams.week,
    shallow: false,
  })
  const { settings } = useSettingsContext()
  const weekStartsOn = settings.weekStartsOn === '0' ? 0 : 1

  const now = new Date()
  const currentWeekStart = startOfWeek(now, { weekStartsOn })
  const selectedWeekStart =
    weekOffset === 0
      ? currentWeekStart
      : subWeeks(currentWeekStart, Math.abs(weekOffset))
  const selectedWeekEnd = endOfWeek(selectedWeekStart, { weekStartsOn })

  const isCurrent = weekOffset === 0

  const sameYear =
    selectedWeekStart.getFullYear() === selectedWeekEnd.getFullYear()
  const sameMonth =
    sameYear && selectedWeekStart.getMonth() === selectedWeekEnd.getMonth()

  let weekLabel: string
  if (sameMonth) {
    weekLabel = `${format(selectedWeekStart, 'MMM d')} – ${format(selectedWeekEnd, 'd, yyyy')}`
  } else if (sameYear) {
    weekLabel = `${format(selectedWeekStart, 'MMM d')} – ${format(selectedWeekEnd, 'MMM d, yyyy')}`
  } else {
    weekLabel = `${format(selectedWeekStart, 'MMM d, yyyy')} – ${format(selectedWeekEnd, 'MMM d, yyyy')}`
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={() => setWeekOffset((prev) => (prev ?? 0) - 1)}
        size="icon-sm"
        variant="outline"
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-[140px] px-2 text-center font-medium text-sm">
        {weekLabel}
      </span>
      <Button
        disabled={isCurrent}
        onClick={() => {
          const next = (weekOffset ?? 0) + 1
          setWeekOffset(next >= 0 ? null : next)
        }}
        size="icon-sm"
        variant="outline"
      >
        <ChevronRight />
      </Button>
      {!isCurrent && (
        <Button
          className="ml-1"
          onClick={() => setWeekOffset(null)}
          size="sm"
          variant="ghost"
        >
          Today
        </Button>
      )}
    </div>
  )
}
