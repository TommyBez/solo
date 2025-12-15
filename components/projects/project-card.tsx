"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { MoreHorizontal, Pencil, Archive, Trash2, Clock, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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
import { ProjectForm } from "./project-form"
import { updateProject, deleteProject } from "@/lib/actions/projects"
import type { Area } from "@/lib/db/schema"

interface ProjectCardProps {
  project: {
    id: number
    name: string
    description: string | null
    status: string
    expectedHours: number
    deadline: Date | null
    totalHours: number
    hoursThisWeek: number
    percentageComplete: number
    area: Area
  }
  areas: Area[]
}

const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  "on-hold": "secondary",
  completed: "outline",
}

export function ProjectCard({ project, areas }: ProjectCardProps) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  async function handleArchive() {
    try {
      await updateProject(project.id, { archived: true })
      toast.success("Project archived")
      router.refresh()
    } catch {
      toast.error("Failed to archive project")
    }
  }

  async function handleDelete() {
    try {
      await deleteProject(project.id)
      toast.success("Project deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete project")
    }
  }

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: project.area.color }} />
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Badge variant={statusVariants[project.status]}>{project.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{project.area.name}</p>
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
          {project.description && <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="size-4" />
              <span>{project.hoursThisWeek}h this week</span>
            </div>
            {project.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="size-4" />
                <span>{format(new Date(project.deadline), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>

          {project.expectedHours > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">
                  {project.totalHours}h / {project.expectedHours}h
                </span>
              </div>
              <Progress value={Math.min(project.percentageComplete, 100)} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project details below.</DialogDescription>
          </DialogHeader>
          <ProjectForm
            project={{
              id: project.id,
              areaId: project.area.id,
              name: project.name,
              description: project.description,
              status: project.status,
              expectedHours: project.expectedHours,
              deadline: project.deadline,
              archived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }}
            areas={areas}
            onSuccess={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{project.name}" and all its time entries. This action cannot be undone.
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
