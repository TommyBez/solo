'use client'

import {
  Archive,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { deleteArea, updateArea } from '@/lib/actions/areas'
import type { Client } from '@/lib/db/schema'
import { AreaForm } from './area-form'

interface AreaCardProps {
  area: {
    id: number
    name: string
    description: string | null
    color: string
    expectedHoursPerWeek: number
    hoursThisWeek: number
    percentageComplete: number
    projectCount: number
    clientId: number | null
  }
  clients?: Client[]
}

const EMPTY_CLIENTS: Client[] = []

export function AreaCard({ area, clients = EMPTY_CLIENTS }: AreaCardProps) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  async function handleArchive() {
    try {
      await updateArea(area.id, { archived: true })
      toast.success('Area archived')
      router.refresh()
    } catch {
      toast.error('Failed to archive area')
    }
  }

  async function handleDelete() {
    try {
      await deleteArea(area.id)
      toast.success('Area deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete area')
    }
  }

  return (
    <>
      <Card className="relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full w-1"
          style={{ backgroundColor: area.color }}
        />
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">{area.name}</CardTitle>
            {area.description ? (
              <p className="line-clamp-1 text-muted-foreground text-sm">
                {area.description}
              </p>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="size-8" size="icon" variant="ghost">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="mr-2 size-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              <FolderKanban className="size-4" />
              <span>{area.projectCount} projects</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Weekly Progress</span>
              <span className="font-medium">
                {area.hoursThisWeek}h / {area.expectedHoursPerWeek}h
              </span>
            </div>
            <Progress
              className="h-2"
              value={Math.min(area.percentageComplete, 100)}
            />
            <p className="text-muted-foreground text-xs">
              {area.percentageComplete >= 100
                ? 'Goal reached!'
                : `${area.expectedHoursPerWeek - area.hoursThisWeek}h remaining`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog onOpenChange={setIsEditOpen} open={isEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
            <DialogDescription>
              Update the area details below.
            </DialogDescription>
          </DialogHeader>
          <AreaForm
            area={{
              id: area.id,
              name: area.name,
              description: area.description,
              color: area.color,
              expectedHoursPerWeek: area.expectedHoursPerWeek,
              clientId: area.clientId,
            }}
            clients={clients}
            onSuccess={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setIsDeleteOpen} open={isDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Area</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{area.name}" and all its projects
              and time entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
