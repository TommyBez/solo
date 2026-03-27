'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { ClientForm } from './client-form'

export function CreateClientDialog() {
  const [open, setOpen] = useState(false)

  const trigger = (
    <Button>
      <Plus className="mr-2 size-4" />
      Add Client
    </Button>
  )

  const form = <ClientForm onSuccess={() => setOpen(false)} />

  return (
    <ResponsiveDialog
      className="md:max-w-lg"
      description="Create a new client to track work."
      onOpenChange={setOpen}
      open={open}
      title="Add New Client"
      trigger={trigger}
    >
      {form}
    </ResponsiveDialog>
  )
}
