"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreHorizontal, Pencil, Archive, Trash2, FolderKanban } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AreaForm } from "./area-form"
import { updateArea, deleteArea } from "@/lib/actions/areas"

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
  }
}

export function AreaCard({ area }: AreaCardProps) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  async function handleArchive() {
    try {
      await updateArea(area.id, { archived: true })
      toast.success("Area archived")
      router.refresh()
    } catch {
      toast.error("Failed to archive area")
    }
  }

  async function handleDelete() {
    try {
      await deleteArea(area.id)
      toast.success("Area deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete area")
    }
  }

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: area.color }} />
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">{area.name}</CardTitle>
            {area.description && <p className="text-sm text-muted-foreground line-clamp-1">{area.description}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
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
              <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-destructive">
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
            <Progress value={Math.min(area.percentageComplete, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {area.percentageComplete >= 100
                ? "Goal reached!"
                : `${area.expectedHoursPerWeek - area.hoursThisWeek}h remaining`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
            <DialogDescription>Update the area details below.</DialogDescription>
          </DialogHeader>
          <AreaForm
            area={{
              id: area.id,
              name: area.name,
              description: area.description,
              color: area.color,
              expectedHoursPerWeek: area.expectedHoursPerWeek,
              archived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }}
            onSuccess={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Area</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{area.name}" and all its projects and time entries. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
