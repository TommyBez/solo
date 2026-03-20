import { FolderKanban, Layers } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { ColorDot } from '@/components/color-indicator'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { ExportTasksDialog } from '@/components/projects/export-tasks-dialog'
import { ProjectCard } from '@/components/projects/project-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getActiveOrganizationSlug } from '@/lib/auth/session'
import { getAreas } from '@/lib/queries/areas'
import { getClients } from '@/lib/queries/clients'
import { getProjectsWithStats } from '@/lib/queries/projects'

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage your specific endeavors and track progress"
        title="Projects"
      />

      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsContent />
      </Suspense>
    </div>
  )
}

async function ProjectsContent() {
  const [projects, areas, clients, slug] = await Promise.all([
    getProjectsWithStats(),
    getAreas(),
    getClients(),
    getActiveOrganizationSlug(),
  ])

  // Group projects by area
  const projectsByArea = projects.reduce(
    (acc, project) => {
      const areaName = project.area.name
      if (!acc[areaName]) {
        acc[areaName] = {
          area: project.area,
          projects: [],
        }
      }
      acc[areaName].projects.push(project)
      return acc
    },
    {} as Record<
      string,
      { area: (typeof projects)[0]['area']; projects: typeof projects }
    >,
  )

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <ExportTasksDialog
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            area: p.area,
          }))}
        />
        <CreateProjectDialog areas={areas} clients={clients} />
      </div>

      {areas.length === 0 && (
        <EmptyState
          action={
            <Button asChild>
              <Link href={`/${slug}/areas`}>Go to Areas</Link>
            </Button>
          }
          description="You need to create an area before adding projects"
          icon={Layers}
          title="Create an area first"
        />
      )}
      {areas.length > 0 && projects.length === 0 && (
        <EmptyState
          action={<CreateProjectDialog areas={areas} clients={clients} />}
          description="Create your first project to start tracking time"
          icon={FolderKanban}
          title="No projects yet"
        />
      )}
      {areas.length > 0 && projects.length > 0 && (
        <div className="space-y-8">
          {Object.entries(projectsByArea).map(
            ([areaName, { area, projects: areaProjects }]) => (
              <div className="space-y-4" key={areaName}>
                <div className="flex items-center gap-2">
                  <ColorDot className="size-3" color={area.color} />
                  <h2 className="font-semibold text-xl">{areaName}</h2>
                  <span className="text-muted-foreground text-sm">
                    ({areaProjects.length} projects)
                  </span>
                </div>
                <div className="stagger-children grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {areaProjects.map((project) => (
                    <ProjectCard
                      areas={areas}
                      clients={clients}
                      key={project.id}
                      project={project}
                    />
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </>
  )
}

function ProjectsSkeleton() {
  const skeletonGroups = [
    { id: 'group-1', cards: ['card-1', 'card-2'] },
  ]

  return (
    <>
      <div className="flex items-center justify-end">
        <Skeleton className="h-9 w-28 sm:h-10 sm:w-32" />
      </div>
      <div className="space-y-6 sm:space-y-8">
        {skeletonGroups.map((group) => (
          <div className="space-y-3 sm:space-y-4" key={group.id}>
            <Skeleton className="h-6 w-40 sm:h-7 sm:w-48" />
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.cards.map((cardId) => (
                <Skeleton className="h-44 sm:h-52" key={cardId} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
