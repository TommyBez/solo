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
import { AreaForm } from "./area-form"

export function CreateAreaDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            Areas are broad contexts like "Fractional CTO" or "Mentorship" that contain multiple projects.
          </DialogDescription>
        </DialogHeader>
        <AreaForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
