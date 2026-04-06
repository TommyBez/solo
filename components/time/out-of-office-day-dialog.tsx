'use client'

import { AlertCircle, LoaderCircle, Plane } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import {
  markOutOfOfficeDay,
  removeOutOfOfficeDay,
} from '@/lib/actions/out-of-office'
import { useSettingsContext } from '@/lib/context/settings-context'

interface OutOfOfficeDayDialogProps {
  date: Date
  entryCount?: number
  isOutOfOffice: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
  /** Pass `null` to omit a trigger (e.g. open only from a parent menu). */
  trigger?: ReactNode
}

export function OutOfOfficeDayDialog({
  date,
  entryCount = 0,
  isOutOfOffice,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: OutOfOfficeDayDialogProps) {
  const router = useRouter()
  const { formatDate } = useSettingsContext()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (next: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(next)
    } else {
      setInternalOpen(next)
    }
  }
  const [isPending, startTransition] = useTransition()

  const formattedDate = useMemo(
    () => formatDate(date, 'EEEE, MMMM d, yyyy'),
    [date, formatDate],
  )
  const hasTrackedTime = entryCount > 0
  const canMarkDay = !(isOutOfOffice || hasTrackedTime)

  const defaultTrigger = (
    <Button size="sm" variant={isOutOfOffice ? 'secondary' : 'outline'}>
      <Plane data-icon="inline-start" />
      {isOutOfOffice ? 'Out of office' : 'Mark day'}
    </Button>
  )

  const actionLabel = isOutOfOffice
    ? 'Remove out-of-office status'
    : 'Mark out of office'

  const footer = (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button onClick={() => setOpen(false)} type="button" variant="outline">
        Cancel
      </Button>
      <Button
        disabled={isPending || !(isOutOfOffice || canMarkDay)}
        onClick={() =>
          startTransition(async () => {
            try {
              if (isOutOfOffice) {
                await removeOutOfOfficeDay(date)
                toast.success('Day marked as available again')
              } else {
                await markOutOfOfficeDay(date)
                toast.success('Day marked as out of office')
              }
              router.refresh()
              setOpen(false)
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : 'Failed to update day status',
              )
            }
          })
        }
        type="button"
      >
        {isPending ? <LoaderCircle className="animate-spin" /> : <Plane />}
        {actionLabel}
      </Button>
    </div>
  )

  return (
    <ResponsiveDialog
      description="Marked days are excluded from out-of-office-aware dashboard goals and chat gap checks."
      footer={footer}
      onOpenChange={setOpen}
      open={open}
      title="Day availability"
      trigger={trigger === undefined ? defaultTrigger : trigger}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isOutOfOffice ? 'secondary' : 'outline'}>
            {isOutOfOffice ? 'Out of office' : 'Available'}
          </Badge>
          <p className="text-muted-foreground text-sm">{formattedDate}</p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="font-medium text-sm">
            {isOutOfOffice
              ? 'This day is currently blocked as out of office.'
              : 'Use this when you know you will not be working that day.'}
          </p>
          <p className="mt-1 text-muted-foreground text-sm">
            {isOutOfOffice
              ? 'The dashboard target is reduced for the week, and chat treats this day as intentional time off.'
              : 'The calendar, dashboard, and chat will all treat this as a planned day away.'}
          </p>
        </div>

        {hasTrackedTime ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Tracked time already exists</AlertTitle>
            <AlertDescription>
              Remove the {entryCount} time{' '}
              {entryCount === 1 ? 'entry' : 'entries'} on this day before
              marking it out of office.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}
