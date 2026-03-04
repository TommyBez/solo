import { Suspense } from 'react'
import { AreasComparisonChart } from '@/components/dashboard/areas-comparison-chart'
import { DailyBreakdownChart } from '@/components/dashboard/daily-breakdown-chart'
import { RecentEntries } from '@/components/dashboard/recent-entries'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TimeDistributionChart } from '@/components/dashboard/time-distribution-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { getDashboardStats, getTimeEntries } from '@/lib/queries/time-entries'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your freelance activity and time tracking
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

async function DashboardContent() {
  const [stats, recentEntries] = await Promise.all([
    getDashboardStats(),
    getTimeEntries(undefined, 5),
  ])

  return (
    <>
      <StatsCards
        activeAreasCount={stats.activeAreasCount}
        activeProjectsCount={stats.activeProjectsCount}
        monthlyChange={stats.monthlyChange}
        monthlyHours={stats.monthlyHours}
        totalExpectedWeeklyHours={stats.totalExpectedWeeklyHours}
        weeklyChange={stats.weeklyChange}
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
    </>
  )
}

function DashboardSkeleton() {
  return (
    <>
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
    </>
  )
}
