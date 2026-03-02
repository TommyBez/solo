'use client'

import { format } from 'date-fns'
import {
  Archive,
  Calendar,
  Clock,
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
import { Badge } from '@/components/ui/badge'
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
import { deleteProject, updateProject } from '@/lib/actions/projects'
import type { Area } from '@/lib/db/schema'
import { ProjectForm } from './project-form'

interface ProjectCardProps {
  areas: Area[]
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
    hourlyRate: string | null
    area: Area
  }
}

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  'on-hold': 'secondary',
  completed: 'outline',
}

export function ProjectCard({ project, areas }: ProjectCardProps) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  async function handleArchive() {
    try {
      await updateProject(project.id, { archived: true })
      toast.success('Project archived')
      router.refresh()
    } catch {
      toast.error('Failed to archive project')
    }
  }

  async function handleDelete() {
    try {
      await deleteProject(project.id)
      toast.success('Project deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete project')
    }
  }

  return (
    <>
      <Card className="relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full w-1"
          style={{ backgroundColor: project.area.color }}
        />
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Badge variant={statusVariants[project.status]}>
                {project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{project.area.name}</p>
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
          {project.description ? (
            <p className="line-clamp-2 text-muted-foreground text-sm">
              {project.description}
            </p>
          ) : null}

          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              <Clock className="size-4" />
              <span>{project.hoursThisWeek}h this week</span>
            </div>
            {project.deadline ? (
              <div className="flex items-center gap-1">
                <Calendar className="size-4" />
                <span>{format(new Date(project.deadline), 'MMM d, yyyy')}</span>
              </div>
            ) : null}
          </div>

          {project.expectedHours > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">
                  {project.totalHours}h / {project.expectedHours}h
                </span>
              </div>
              <Progress
                className="h-2"
                value={Math.min(project.percentageComplete, 100)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog onOpenChange={setIsEditOpen} open={isEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the project details below.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            areas={areas}
            onSuccess={() => setIsEditOpen(false)}
            project={{
              id: project.id,
              areaId: project.area.id,
              name: project.name,
              description: project.description,
              status: project.status,
              expectedHours: project.expectedHours,
              deadline: project.deadline,
              hourlyRate: project.hourlyRate,
              archived: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={setIsDeleteOpen} open={isDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{project.name}" and all its time
              entries. This action cannot be undone.
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
