import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TimeEntry {
  id: number
  description: string | null
  startTime: string
  durationMinutes: number
  billable: boolean
  projectName: string
  areaName: string
  areaColor: string
}

export function TimeEntriesCard({
  entries,
}: { entries: TimeEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
        No time entries found.
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(entry.startTime), 'MMM d')}
              </TableCell>
              <TableCell>{entry.projectName}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: entry.areaColor }}
                  />
                  {entry.areaName}
                </span>
              </TableCell>
              <TableCell className="max-w-48 truncate text-muted-foreground">
                {entry.description || '-'}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {(entry.durationMinutes / 60).toFixed(1)}h
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
