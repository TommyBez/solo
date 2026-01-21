'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Area } from '@/lib/db/schema'
import { ProjectForm } from './project-form'

type CreateProjectDialogProps = {
  areas: Area[]
}

export function CreateProjectDialog({ areas }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)

  if (areas.length === 0) {
    return (
      <Button disabled>
        <Plus className="mr-2 size-4" />
        New Project
      </Button>
    )
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Projects are specific endeavors within an area, like "CTO for XY
            Agency" or "Build Mobile App".
          </DialogDescription>
        </DialogHeader>
        <ProjectForm areas={areas} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
