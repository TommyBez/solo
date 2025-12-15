import { Suspense } from "react"
import Link from "next/link"
import { getTimeEntries } from "@/lib/actions/time-entries"
import { getProjects } from "@/lib/actions/projects"
import { TimerWidget } from "@/components/time/timer-widget"
import { TimeEntriesList } from "@/components/time/time-entries-list"
import { AddTimeEntryDialog } from "@/components/time/add-time-entry-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

async function TimeTrackingContent() {
  const [entries, projects] = await Promise.all([getTimeEntries(undefined, 50), getProjects()])

  const activeProjects = projects.filter((p) => p.status === "active")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">Track your work hours and manage time entries</p>
        </div>
        <AddTimeEntryDialog projects={activeProjects} />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">Create a project first</h3>
          <p className="mb-4 text-sm text-muted-foreground">You need to create a project before tracking time</p>
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

function TimeTrackingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-1" />
        <Skeleton className="h-96 lg:col-span-2" />
      </div>
    </div>
  )
}

export default function TimeTrackingPage() {
  return (
    <Suspense fallback={<TimeTrackingSkeleton />}>
      <TimeTrackingContent />
    </Suspense>
  )
}
