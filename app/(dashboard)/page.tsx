import { Suspense } from "react"
import { getDashboardStats } from "@/lib/actions/time-entries"
import { getTimeEntries } from "@/lib/actions/time-entries"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { TimeDistributionChart } from "@/components/dashboard/time-distribution-chart"
import { DailyBreakdownChart } from "@/components/dashboard/daily-breakdown-chart"
import { AreasComparisonChart } from "@/components/dashboard/areas-comparison-chart"
import { RecentEntries } from "@/components/dashboard/recent-entries"
import { Skeleton } from "@/components/ui/skeleton"

async function DashboardContent() {
  const [stats, recentEntries] = await Promise.all([getDashboardStats(), getTimeEntries(undefined, 5)])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your freelance activity and time tracking</p>
      </div>

      <StatsCards
        weeklyHours={stats.weeklyHours}
        monthlyHours={stats.monthlyHours}
        activeAreasCount={stats.activeAreasCount}
        activeProjectsCount={stats.activeProjectsCount}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <TimeDistributionChart data={stats.timeByArea} />
        <DailyBreakdownChart data={stats.dailyBreakdown} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AreasComparisonChart data={stats.areasComparison} />
        </div>
        <RecentEntries entries={recentEntries} />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[380px]" />
        <Skeleton className="h-[380px]" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
