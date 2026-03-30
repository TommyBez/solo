interface Area {
  color: string
  description: string | null
  expectedHoursPerWeek: number
  id: number
  name: string
  projectCount: number
}

export function AreasCard({ areas }: { areas: Area[] }) {
  if (areas.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-3 text-muted-foreground text-sm">
        No areas found.
      </div>
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {areas.map((area) => (
        <div
          className="flex flex-col gap-1 rounded-md border border-border bg-card px-3 py-2"
          key={area.id}
        >
          <span className="flex items-center gap-1.5 font-medium text-sm">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: area.color }}
            />
            {area.name}
          </span>
          <div className="flex gap-3 text-muted-foreground text-xs">
            <span>{area.expectedHoursPerWeek}h/week goal</span>
            <span>
              {area.projectCount} project{area.projectCount !== 1 ? 's' : ''}
            </span>
          </div>
          {area.description && (
            <span className="truncate text-muted-foreground text-xs">
              {area.description}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
