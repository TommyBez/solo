interface Area {
  id: number
  name: string
  color: string
  expectedHoursPerWeek: number
  projectCount: number
  description: string | null
}

export function AreasCard({ areas }: { areas: Area[] }) {
  if (areas.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
        No areas found.
      </div>
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {areas.map((area) => (
        <div
          key={area.id}
          className="flex flex-col gap-1 rounded-md border border-border bg-card px-3 py-2"
        >
          <span className="flex items-center gap-1.5 font-medium text-sm">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: area.color }}
            />
            {area.name}
          </span>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{area.expectedHoursPerWeek}h/week goal</span>
            <span>
              {area.projectCount} project{area.projectCount !== 1 ? 's' : ''}
            </span>
          </div>
          {area.description && (
            <span className="text-xs text-muted-foreground truncate">
              {area.description}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
