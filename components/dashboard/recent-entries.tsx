import { formatDistanceToNow } from 'date-fns'
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
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest time entries</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No recent entries
          </p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
                key={entry.id}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: entry.project.area.color }}
                    />
                    <span className="font-medium text-sm">
                      {entry.project.name}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="line-clamp-1 text-muted-foreground text-sm">
                      {entry.description}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(entry.startTime), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Badge variant="secondary">
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
