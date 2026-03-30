import { format } from 'date-fns'

interface Stats {
  activeAreasCount: number
  activeProjectsCount: number
  prevWeeklyHours: number
  timeByArea: Array<{ name: string; hours: number }>
  totalExpectedWeeklyHours: number
  weeklyChange: number
  weeklyHours: number
  weekStartDate: string
}

export function StatsCard({ stats }: { stats: Stats }) {
  const weekLabel = format(new Date(stats.weekStartDate), 'MMM d')

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatItem
          change={stats.weeklyChange}
          label={`Week of ${weekLabel}`}
          value={`${stats.weeklyHours}h`}
        />
        <StatItem label="Goal" value={`${stats.totalExpectedWeeklyHours}h`} />
        <StatItem label="Active areas" value={String(stats.activeAreasCount)} />
        <StatItem
          label="Active projects"
          value={String(stats.activeProjectsCount)}
        />
      </div>
      {stats.timeByArea.length > 0 && (
        <div className="rounded-md border border-border bg-card px-3 py-2">
          <span className="font-medium text-muted-foreground text-xs">
            Time by area
          </span>
          <div className="mt-1 space-y-1">
            {stats.timeByArea.map((area) => (
              <div
                className="flex items-center justify-between text-sm"
                key={area.name}
              >
                <span>{area.name}</span>
                <span className="font-medium tabular-nums">{area.hours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatItem({
  label,
  value,
  change,
}: {
  label: string
  value: string
  change?: number
}) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-semibold text-lg tabular-nums">{value}</span>
        {change !== undefined && (
          <span
            className={`text-xs tabular-nums ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            {change >= 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
    </div>
  )
}
