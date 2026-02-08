'use client'

import { format } from 'date-fns'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteTimeEntry } from '@/lib/actions/time-entries'
import type { Area, Project } from '@/lib/db/schema'
import { TimeEntryForm } from './time-entry-form'

type TimeEntry = {
  id: number
  projectId: number
  description: string | null
  startTime: Date
  endTime: Date | null
  durationMinutes: number
  billable: boolean
  createdAt: Date
  project: Project & { area: Area }
}

type TimeEntriesListProps = {
  entries: TimeEntry[]
  projects: (Project & { area: Area })[]
}

export function TimeEntriesList({ entries, projects }: TimeEntriesListProps) {
  const router = useRouter()
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

  // Group entries by date
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
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>Your recent time tracking records</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No time entries yet. Start tracking!
            </p>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => {
                const dayEntries = entriesByDate[dateKey]
                const totalMinutes = dayEntries.reduce(
                  (sum, e) => sum + e.durationMinutes,
                  0,
                )

                return (
                  <div className="space-y-3" key={dateKey}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">
                        {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <Badge variant="secondary">
                        {formatDuration(totalMinutes)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {dayEntries.map((entry) => (
                        <div
                          className="flex items-start justify-between gap-4 rounded-lg border p-3"
                          key={entry.id}
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <div
                                className="size-2 rounded-full"
                                style={{
                                  backgroundColor: entry.project.area.color,
                                }}
                              />
                              <span className="font-medium text-sm">
                                {entry.project.name}
                              </span>
                            </div>
                            {entry.description ? (
                              <p className="text-muted-foreground text-sm">
                                {entry.description}
                              </p>
                            ) : null}
                            <p className="text-muted-foreground text-xs">
                              {format(new Date(entry.startTime), 'h:mm a')}
                              {entry.endTime
                                ? ` - ${format(new Date(entry.endTime), 'h:mm a')}`
                                : null}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {formatDuration(entry.durationMinutes)}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  className="size-8"
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

      <Dialog
        onOpenChange={(open) => !open && setEditEntry(null)}
        open={!!editEntry}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>
              Update the time entry details.
            </DialogDescription>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

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
