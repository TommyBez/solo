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
import { ClientForm } from './client-form'

export function CreateClientDialog() {
  const [open, setOpen] = useState(false)

  return (
    <ResponsiveDialog onOpenChange={setOpen} open={open}>
      <ResponsiveDialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Add Client
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="md:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add New Client</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Create a new client to track work.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 pb-4 md:px-0 md:pb-0">
          <ClientForm onSuccess={() => setOpen(false)} />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
