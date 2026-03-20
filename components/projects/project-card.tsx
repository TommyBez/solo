'use client'

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
import { ColorBar } from '@/components/color-indicator'
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
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { deleteProject, updateProject } from '@/lib/actions/projects'
import { useSettingsContext } from '@/lib/context/settings-context'
import type { Area, Client } from '@/lib/db/schema'
import { ProjectForm } from './project-form'

interface ProjectCardProps {
  areas: Area[]
  clients?: Client[]
  project: {
    id: number
    name: string
    description: string | null
    status: string
    expectedHours: number
    recurring: boolean
    clientId: number | null
    deadline: Date | null
    totalHours: number
    hoursThisWeek: number
    progressHours: number
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

const statusClassNames: Record<string, string> = {
  active: 'border-0 bg-success/10 text-success',
  'on-hold': '',
  completed: '',
}

export function ProjectCard({ project, areas, clients }: ProjectCardProps) {
  const router = useRouter()
  const { formatDate } = useSettingsContext()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const progressLabel = project.recurring ? 'Weekly Progress' : 'Progress'
  const progressSuffix = project.recurring ? 'weekly target' : 'total target'

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
      <Card className="relative overflow-hidden transition-[box-shadow,ring-color] duration-200 hover:ring-foreground/20">
        <ColorBar color={project.area.color} />
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <CardTitle className="truncate text-base sm:text-lg">{project.name}</CardTitle>
              <Badge
                className={`text-[10px] sm:text-xs ${statusClassNames[project.status] || ''}`}
                variant={statusVariants[project.status]}
              >
                {project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">{project.area.name}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="size-9 shrink-0 sm:size-8" size="icon" variant="ghost">
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
        <CardContent className="space-y-3 p-4 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
          {project.description ? (
            <p className="line-clamp-2 text-muted-foreground text-xs sm:text-sm">
              {project.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs sm:gap-4 sm:text-sm">
            <div className="flex items-center gap-1">
              <Clock className="size-3.5 sm:size-4" />
              <span>{project.hoursThisWeek}h this week</span>
            </div>
            {project.deadline ? (
              <div className="flex items-center gap-1">
                <Calendar className="size-3.5 sm:size-4" />
                <span>{formatDate(project.deadline)}</span>
              </div>
            ) : null}
          </div>

          {project.expectedHours > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span>{progressLabel}</span>
                <span className="font-medium">
                  {project.progressHours}h / {project.expectedHours}h
                </span>
              </div>
              <Progress
                className="h-2"
                value={Math.min(project.percentageComplete, 100)}
              />
              <p className="text-muted-foreground text-xs">{progressSuffix}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ResponsiveDialog onOpenChange={setIsEditOpen} open={isEditOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Edit Project</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Update the project details below.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="px-4 pb-4 md:px-0 md:pb-0">
            <ProjectForm
              areas={areas}
              clients={clients}
              onSuccess={() => setIsEditOpen(false)}
              project={{
                id: project.id,
                areaId: project.area.id,
                clientId: project.clientId,
                name: project.name,
                description: project.description,
                status: project.status,
                expectedHours: project.expectedHours,
                recurring: project.recurring,
                deadline: project.deadline,
                hourlyRate: project.hourlyRate,
                archived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              }}
            />
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

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
