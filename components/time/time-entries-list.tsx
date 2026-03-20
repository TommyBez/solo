'use client'

import { format } from 'date-fns'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { ColorDot } from '@/components/color-indicator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteTimeEntry } from '@/lib/actions/time-entries'
import { useSettingsContext } from '@/lib/context/settings-context'
import type { Area, Project } from '@/lib/db/schema'
import { TimeEntryForm } from './time-entry-form'

interface TimeEntry {
  billable: boolean
  createdAt: Date
  description: string | null
  durationMinutes: number
  endTime: Date | null
  id: number
  project: Project & { area: Area }
  projectId: number
  startTime: Date
}

interface TimeEntriesListProps {
  entries: TimeEntry[]
  projects: (Project & { area: Area })[]
}

export function TimeEntriesList({ entries, projects }: TimeEntriesListProps) {
  const router = useRouter()
  const { formatDate, formatTime } = useSettingsContext()
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null)
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null)

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) {
      return `${mins}m`
    }
    if (mins === 0) {
      return `${hours}h`
    }
    return `${hours}h ${mins}m`
  }

  async function handleDelete() {
    if (!deleteEntryId) {
      return
    }
    try {
      await deleteTimeEntry(deleteEntryId)
      toast.success('Entry deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete entry')
    }
    setDeleteEntryId(null)
  }

  // Group entries by date (internal key format)
  const entriesByDate = entries.reduce(
    (acc, entry) => {
      const dateKey = format(new Date(entry.startTime), 'yyyy-MM-dd')
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(entry)
      return acc
    },
    {} as Record<string, TimeEntry[]>,
  )

  const sortedDates = Object.keys(entriesByDate).sort((a, b) =>
    b.localeCompare(a),
  )

  return (
    <>
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">Time Entries</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your recent time tracking records</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
          {entries.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm sm:py-8">
              No time entries yet. Start tracking!
            </p>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {sortedDates.map((dateKey) => {
                const dayEntries = entriesByDate[dateKey]
                const totalMinutes = dayEntries.reduce(
                  (sum, e) => sum + e.durationMinutes,
                  0,
                )

                return (
                  <div className="space-y-2 sm:space-y-3" key={dateKey}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium text-xs sm:text-sm">
                        <span className="sm:hidden">{formatDate(dateKey, 'EEE, MMM d')}</span>
                        <span className="hidden sm:inline">{formatDate(dateKey, 'EEEE, MMMM d, yyyy')}</span>
                      </h3>
                      <Badge
                        className="font-mono text-[10px] tabular-nums sm:text-xs"
                        variant="secondary"
                      >
                        {formatDuration(totalMinutes)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {dayEntries.map((entry) => (
                        <div
                          className="flex items-start justify-between gap-2 rounded-lg border p-2 sm:gap-4 sm:p-3"
                          key={entry.id}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <ColorDot color={entry.project.area.color} />
                              <span className="truncate font-medium text-xs sm:text-sm">
                                {entry.project.name}
                              </span>
                            </div>
                            {entry.description ? (
                              <p className="line-clamp-1 text-muted-foreground text-xs sm:text-sm">
                                {entry.description}
                              </p>
                            ) : null}
                            <p className="text-muted-foreground text-[10px] sm:text-xs">
                              {formatTime(entry.startTime)}
                              {entry.endTime
                                ? ` - ${formatTime(entry.endTime)}`
                                : null}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                            <Badge
                              className="hidden font-mono tabular-nums sm:inline-flex"
                              variant="outline"
                            >
                              {formatDuration(entry.durationMinutes)}
                            </Badge>
                            <span className="font-mono text-[10px] tabular-nums text-muted-foreground sm:hidden">
                              {formatDuration(entry.durationMinutes)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  className="size-8 sm:size-8"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setEditEntry(entry)}
                                >
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteEntryId(entry.id)}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ResponsiveDialog
        onOpenChange={(open) => !open && setEditEntry(null)}
        open={!!editEntry}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Edit Time Entry</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Update the time entry details.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="px-4 pb-4 md:px-0 md:pb-0">
            {editEntry ? (
              <TimeEntryForm
                entry={{
                  id: editEntry.id,
                  projectId: editEntry.projectId,
                  description: editEntry.description,
                  startTime: editEntry.startTime,
                  endTime: editEntry.endTime,
                  durationMinutes: editEntry.durationMinutes,
                  billable: editEntry.billable,
                  createdAt: editEntry.createdAt,
                }}
                onSuccess={() => setEditEntry(null)}
                projects={projects}
              />
            ) : null}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <AlertDialog
        onOpenChange={(open) => !open && setDeleteEntryId(null)}
        open={!!deleteEntryId}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this time entry. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
