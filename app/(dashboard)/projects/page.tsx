import Link from 'next/link'
import { Suspense } from 'react'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { ProjectCard } from '@/components/projects/project-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getAreas } from '@/lib/actions/areas'
import { getProjectsWithStats } from '@/lib/actions/projects'

async function ProjectsContent() {
  const [projects, areas] = await Promise.all([
    getProjectsWithStats(),
    getAreas(),
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your specific endeavors and track progress
          </p>
        </div>
        <CreateProjectDialog areas={areas} />
      </div>

      {areas.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="font-semibold text-lg">Create an area first</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            You need to create an area before adding projects
          </p>
          <Button asChild>
            <Link href="/areas">Go to Areas</Link>
          </Button>
        </div>
      )}
      {areas.length > 0 && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="font-semibold text-lg">No projects yet</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            Create your first project to start tracking time
          </p>
          <CreateProjectDialog areas={areas} />
        </div>
      )}
      {areas.length > 0 && projects.length > 0 && (
        <div className="space-y-8">
          {Object.entries(projectsByArea).map(
            ([areaName, { area, projects: areaProjects }]) => (
              <div className="space-y-4" key={areaName}>
                <div className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: area.color }}
                  />
                  <h2 className="font-semibold text-xl">{areaName}</h2>
                  <span className="text-muted-foreground text-sm">
                    ({areaProjects.length} projects)
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {areaProjects.map((project) => (
                    <ProjectCard
                      areas={areas}
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
    </div>
  )
}

function ProjectsSkeleton() {
  const skeletonGroups = [
    { id: 'group-1', cards: ['card-1', 'card-2', 'card-3'] },
    { id: 'group-2', cards: ['card-4', 'card-5', 'card-6'] },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-8">
        {skeletonGroups.map((group) => (
          <div className="space-y-4" key={group.id}>
            <Skeleton className="h-7 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.cards.map((cardId) => (
                <Skeleton className="h-52" key={cardId} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsContent />
    </Suspense>
  )
}
