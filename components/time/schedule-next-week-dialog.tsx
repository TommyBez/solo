'use client'

import { addWeeks, endOfWeek, format, parseISO, startOfWeek } from 'date-fns'
import { CalendarClock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { scheduleTasksForFollowingWeek } from '@/lib/actions/time-entries'

interface ScheduleNextWeekDialogProps {
  referenceDateIso: string
}

const WEEK_STARTS_ON_MONDAY = 1 as const

function formatTaskCount(value: number) {
  return `${value} task${value === 1 ? '' : 's'}`
}

export function ScheduleNextWeekDialog({
  referenceDateIso,
}: ScheduleNextWeekDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isScheduling, startScheduling] = useTransition()

  const sourceWeekLabel = useMemo(() => {
    const referenceDate = parseISO(referenceDateIso)
    const sourceWeekStart = startOfWeek(referenceDate, {
      weekStartsOn: WEEK_STARTS_ON_MONDAY,
    })
    const sourceWeekEnd = endOfWeek(referenceDate, {
      weekStartsOn: WEEK_STARTS_ON_MONDAY,
    })
    return `${format(sourceWeekStart, 'MMM d')} - ${format(sourceWeekEnd, 'MMM d, yyyy')}`
  }, [referenceDateIso])

  const targetWeekLabel = useMemo(() => {
    const referenceDate = parseISO(referenceDateIso)
    const sourceWeekStart = startOfWeek(referenceDate, {
      weekStartsOn: WEEK_STARTS_ON_MONDAY,
    })
    const nextWeekStart = addWeeks(sourceWeekStart, 1)
    const nextWeekEnd = endOfWeek(nextWeekStart, {
      weekStartsOn: WEEK_STARTS_ON_MONDAY,
    })
    return `${format(nextWeekStart, 'MMM d')} - ${format(nextWeekEnd, 'MMM d, yyyy')}`
  }, [referenceDateIso])

  const handleSchedule = () => {
    startScheduling(async () => {
      try {
        const result = await scheduleTasksForFollowingWeek(referenceDateIso)
        if (result.sourceCount === 0) {
          toast.info('No tasks found in this week to schedule')
        } else if (result.createdCount === 0) {
          toast.info(
            `All ${formatTaskCount(result.sourceCount)} are already scheduled`,
          )
        } else {
          const skippedSuffix =
            result.skippedCount > 0
              ? ` (${formatTaskCount(result.skippedCount)} skipped as duplicates)`
              : ''
          toast.success(
            `Scheduled ${formatTaskCount(result.createdCount)} for next week${skippedSuffix}`,
          )
        }
        setOpen(false)
        router.refresh()
      } catch {
        toast.error('Failed to schedule tasks for next week')
      }
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarClock className="mr-2 size-4" />
          Schedule Next Week
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Schedule Tasks for Following Week</DialogTitle>
          <DialogDescription>
            Copy all tracked tasks from this week to next week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border bg-muted/20 p-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Source week</span>
            <span className="font-medium">{sourceWeekLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Scheduled into</span>
            <span className="font-medium">{targetWeekLabel}</span>
          </div>
          <p className="text-muted-foreground text-xs">
            Existing matching tasks in the target week are skipped
            automatically.
          </p>
        </div>

        <DialogFooter>
          <Button
            disabled={isScheduling}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={isScheduling} onClick={handleSchedule}>
            {isScheduling ? 'Scheduling...' : 'Schedule tasks'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
