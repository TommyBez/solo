'use client'

import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Area, Project } from '@/lib/db/schema'
import {
  SHORTCUT_EVENTS,
  useShortcutEvent,
} from '@/lib/hooks/use-keyboard-shortcuts'
import { TimeEntryForm } from './time-entry-form'

type AddTimeEntryDialogProps = {
  projects: (Project & { area: Area })[]
}

export function AddTimeEntryDialog({ projects }: AddTimeEntryDialogProps) {
  const [open, setOpen] = useState(false)

  // Handle keyboard shortcut to open dialog
  const handleOpenDialog = useCallback(() => {
    if (projects.length > 0) {
      setOpen(true)
    }
  }, [projects.length])

  useShortcutEvent(SHORTCUT_EVENTS.NEW_ENTRY, handleOpenDialog)

  if (projects.length === 0) {
    return (
      <Button disabled>
        <Plus className="mr-2 size-4" />
        Add Entry
      </Button>
    )
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
          <DialogDescription>Log time spent on a project.</DialogDescription>
        </DialogHeader>
        <TimeEntryForm onSuccess={() => setOpen(false)} projects={projects} />
      </DialogContent>
    </Dialog>
  )
}
