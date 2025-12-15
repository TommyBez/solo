import { Suspense } from "react"
import Link from "next/link"
import { getProjectsWithStats } from "@/lib/actions/projects"
import { getAreas } from "@/lib/actions/areas"
import { ProjectCard } from "@/components/projects/project-card"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

async function ProjectsContent() {
  const [projects, areas] = await Promise.all([getProjectsWithStats(), getAreas()])

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
    {} as Record<string, { area: (typeof projects)[0]["area"]; projects: typeof projects }>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your specific endeavors and track progress</p>
        </div>
        <CreateProjectDialog areas={areas} />
      </div>

      {areas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">Create an area first</h3>
          <p className="mb-4 text-sm text-muted-foreground">You need to create an area before adding projects</p>
          <Button asChild>
            <Link href="/areas">Go to Areas</Link>
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Create your first project to start tracking time</p>
          <CreateProjectDialog areas={areas} />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(projectsByArea).map(([areaName, { area, projects: areaProjects }]) => (
            <div key={areaName} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full" style={{ backgroundColor: area.color }} />
                <h2 className="text-xl font-semibold">{areaName}</h2>
                <span className="text-sm text-muted-foreground">({areaProjects.length} projects)</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {areaProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} areas={areas} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectsSkeleton() {
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
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-7 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-52" />
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
