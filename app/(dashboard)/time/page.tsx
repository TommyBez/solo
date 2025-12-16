import Link from 'next/link'
import { AddTimeEntryDialog } from '@/components/time/add-time-entry-dialog'
import { TimeEntriesList } from '@/components/time/time-entries-list'
import { TimerWidget } from '@/components/time/timer-widget'
import { Button } from '@/components/ui/button'
import { getProjects } from '@/lib/queries/projects'
import { getTimeEntries } from '@/lib/queries/time-entries'

export default async function TimeTrackingPage() {
  const [entries, projects] = await Promise.all([
    getTimeEntries(undefined, 50),
    getProjects(),
  ])

  const activeProjects = projects.filter((p) => p.status === 'active')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track your work hours and manage time entries
          </p>
        </div>
        <AddTimeEntryDialog projects={activeProjects} />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="font-semibold text-lg">Create a project first</h3>
          <p className="mb-4 text-muted-foreground text-sm">
            You need to create a project before tracking time
          </p>
          <Button asChild>
            <Link href="/projects">Go to Projects</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <TimerWidget projects={activeProjects} />
          </div>
          <div className="lg:col-span-2">
            <TimeEntriesList entries={entries} projects={activeProjects} />
          </div>
        </div>
      )}
    </div>
  )
}
