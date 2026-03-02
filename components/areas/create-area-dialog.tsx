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
import type { Client } from '@/lib/db/schema'
import { AreaForm } from './area-form'

interface CreateAreaDialogProps {
  clients?: Client[]
}

export function CreateAreaDialog({ clients = [] }: CreateAreaDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          New Area
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Area</DialogTitle>
          <DialogDescription>
            Areas are broad contexts like "Fractional CTO" or "Mentorship" that
            contain multiple projects.
          </DialogDescription>
        </DialogHeader>
        <AreaForm clients={clients} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
