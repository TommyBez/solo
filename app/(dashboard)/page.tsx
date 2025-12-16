import { Suspense } from 'react'
import { AreasComparisonChart } from '@/components/dashboard/areas-comparison-chart'
import { DailyBreakdownChart } from '@/components/dashboard/daily-breakdown-chart'
import { RecentEntries } from '@/components/dashboard/recent-entries'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TimeDistributionChart } from '@/components/dashboard/time-distribution-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { getDashboardStats, getTimeEntries } from '@/lib/actions/time-entries'

async function DashboardContent() {
  const [stats, recentEntries] = await Promise.all([
    getDashboardStats(),
    getTimeEntries(undefined, 5),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your freelance activity and time tracking
        </p>
      </div>

      <StatsCards
        activeAreasCount={stats.activeAreasCount}
        activeProjectsCount={stats.activeProjectsCount}
        monthlyHours={stats.monthlyHours}
        weeklyHours={stats.weeklyHours}
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
        {[
          'skeleton-stats-1',
          'skeleton-stats-2',
          'skeleton-stats-3',
          'skeleton-stats-4',
        ].map((id) => (
          <Skeleton className="h-32" key={id} />
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
