import Link from 'next/link'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { ExportTasksDialog } from '@/components/projects/export-tasks-dialog'
import { ProjectCard } from '@/components/projects/project-card'
import { Button } from '@/components/ui/button'
import { getAreas } from '@/lib/queries/areas'
import { getClients } from '@/lib/queries/clients'
import { getProjectsWithStats } from '@/lib/queries/projects'

export default async function ProjectsPage() {
  const [projects, areas, clients] = await Promise.all([
    getProjectsWithStats(),
    getAreas(),
    getClients(),
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
        <div className="flex items-center gap-2">
          <ExportTasksDialog
            projects={projects.map((p) => ({
              id: p.id,
              name: p.name,
              area: p.area,
            }))}
          />
          <CreateProjectDialog areas={areas} clients={clients} />
        </div>
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
          <CreateProjectDialog areas={areas} clients={clients} />
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
    </div>
  )
}
