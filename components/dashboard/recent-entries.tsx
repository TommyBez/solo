import { formatDistanceToNow } from 'date-fns'
import { Clock } from 'lucide-react'
import { ColorDot } from '@/components/color-indicator'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface RecentEntriesProps {
  entries: Array<{
    id: number
    description: string | null
    durationMinutes: number
    startTime: Date
    project: {
      name: string
      area: {
        name: string
        color: string
      }
    }
  }>
}

export function RecentEntries({ entries }: RecentEntriesProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) {
      return `${mins}m`
    }
    if (mins === 0) {
      return `${hours}h`
    }
    return `${hours}h ${mins}m`
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
        <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Latest time entries</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center sm:py-8">
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted">
              <Clock className="size-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No recent entries</p>
          </div>
        ) : (
          <div className="stagger-children space-y-3 sm:space-y-4">
            {entries.map((entry) => (
              <div
                className="flex items-start justify-between gap-2 rounded-lg border p-2 sm:gap-4 sm:p-3"
                key={entry.id}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <ColorDot color={entry.project.area.color} />
                    <span className="truncate font-medium text-xs sm:text-sm">
                      {entry.project.name}
                    </span>
                  </div>
                  {entry.description ? (
                    <p className="line-clamp-1 text-muted-foreground text-xs sm:text-sm">
                      {entry.description}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground text-[10px] sm:text-xs">
                    {formatDistanceToNow(new Date(entry.startTime), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Badge className="shrink-0 font-mono text-[10px] tabular-nums sm:text-xs" variant="secondary">
                  {formatDuration(entry.durationMinutes)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
