'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog'
import type { Area, Client } from '@/lib/db/schema'
import { ProjectForm } from './project-form'

interface CreateProjectDialogProps {
  areas: Area[]
  clients?: Client[]
}

export function CreateProjectDialog({
  areas,
  clients,
}: CreateProjectDialogProps) {
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
    <ResponsiveDialog onOpenChange={setOpen} open={open}>
      <ResponsiveDialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          New Project
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Create New Project</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Projects are specific endeavors within an area, like "CTO for XY
            Agency" or "Build Mobile App".
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 pb-4 md:px-0 md:pb-0">
          <ProjectForm
            areas={areas}
            clients={clients}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
