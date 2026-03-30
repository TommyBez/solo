import { Badge } from '@/components/ui/badge'

interface Project {
  areaColor: string
  areaName: string
  clientName: string | null
  expectedHours: number
  hourlyRate: string | null
  id: number
  name: string
  status: string
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  completed: 'secondary',
  'on-hold': 'outline',
}

export function ProjectsCard({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-3 text-muted-foreground text-sm">
        No projects found.
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {projects.map((project) => (
        <div
          className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
          key={project.id}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">{project.name}</span>
            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: project.areaColor }}
              />
              {project.areaName}
              {project.clientName && (
                <>
                  <span className="text-border">/</span>
                  {project.clientName}
                </>
              )}
            </span>
          </div>
          <Badge variant={statusVariant[project.status] ?? 'outline'}>
            {project.status}
          </Badge>
        </div>
      ))}
    </div>
  )
}
