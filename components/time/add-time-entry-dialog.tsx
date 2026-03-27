'use client'

import { Plus } from 'lucide-react'
import { type ReactNode, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import type { Area, Project } from '@/lib/db/schema'
import {
  SHORTCUT_EVENTS,
  useShortcutEvent,
} from '@/lib/hooks/use-keyboard-shortcuts'
import { TimeEntryForm, type TimeEntryInitialValues } from './time-entry-form'

interface AddTimeEntryDialogProps {
  buttonLabel?: string
  description?: string
  initialValues?: TimeEntryInitialValues
  projects: (Project & { area: Area })[]
  title?: string
  trigger?: ReactNode
}

export function AddTimeEntryDialog({
  projects,
  initialValues,
  trigger,
  title,
  description,
  buttonLabel,
}: AddTimeEntryDialogProps) {
  const [open, setOpen] = useState(false)

  // Handle keyboard shortcut to open dialog
  const handleOpenDialog = useCallback(() => {
    if (projects.length > 0) {
      setOpen(true)
    }
  }, [projects.length])

  useShortcutEvent(SHORTCUT_EVENTS.NEW_ENTRY, handleOpenDialog)

  if (projects.length === 0) {
    if (trigger) {
      return null
    }

    return (
      <Button disabled>
        <Plus className="mr-2 size-4" />
        {buttonLabel ?? 'Add Entry'}
      </Button>
    )
  }

  const triggerButton = trigger ?? (
    <Button>
      <Plus className="mr-2 size-4" />
      {buttonLabel ?? 'Add Entry'}
    </Button>
  )

  const form = (
    <TimeEntryForm
      initialValues={initialValues}
      onSuccess={() => setOpen(false)}
      projects={projects}
    />
  )

  return (
    <ResponsiveDialog
      description={description ?? 'Log time spent on a project.'}
      onOpenChange={setOpen}
      open={open}
      title={title ?? 'Add Time Entry'}
      trigger={triggerButton}
    >
      {form}
    </ResponsiveDialog>
  )
}
