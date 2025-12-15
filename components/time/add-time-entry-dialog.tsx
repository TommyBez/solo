"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TimeEntryForm } from "./time-entry-form"
import type { Project, Area } from "@/lib/db/schema"

interface AddTimeEntryDialogProps {
  projects: (Project & { area: Area })[]
}

export function AddTimeEntryDialog({ projects }: AddTimeEntryDialogProps) {
  const [open, setOpen] = useState(false)

  if (projects.length === 0) {
    return (
      <Button disabled>
        <Plus className="mr-2 size-4" />
        Add Entry
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <TimeEntryForm projects={projects} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
