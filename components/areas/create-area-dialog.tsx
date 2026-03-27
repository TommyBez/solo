'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { AreaForm } from './area-form'

export function CreateAreaDialog() {
  const [open, setOpen] = useState(false)

  const trigger = (
    <Button>
      <Plus className="mr-2 size-4" />
      New Area
    </Button>
  )

  const form = <AreaForm onSuccess={() => setOpen(false)} />

  return (
    <ResponsiveDialog
      description={
        <>
          Areas are broad contexts like "Fractional CTO" or "Mentorship" that
          contain multiple projects.
        </>
      }
      onOpenChange={setOpen}
      open={open}
      title="Create New Area"
      trigger={trigger}
    >
      {form}
    </ResponsiveDialog>
  )
}
