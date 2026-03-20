import { Suspense } from 'react'
import { AreasComparisonChart } from '@/components/dashboard/areas-comparison-chart'
import { DailyBreakdownChart } from '@/components/dashboard/daily-breakdown-chart'
import { RecentEntries } from '@/components/dashboard/recent-entries'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TimeDistributionChart } from '@/components/dashboard/time-distribution-chart'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getDashboardStats, getTimeEntries } from '@/lib/queries/time-entries'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Overview of your freelance activity and time tracking"
        title="Dashboard"
      />

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

      <div className="stagger-children grid gap-4 sm:gap-6 md:grid-cols-2">
        <TimeDistributionChart data={stats.timeByArea} />
        <DailyBreakdownChart data={stats.dailyBreakdown} />
      </div>

      <div className="stagger-children grid gap-4 sm:gap-6 lg:grid-cols-3">
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          'skeleton-stats-1',
          'skeleton-stats-2',
          'skeleton-stats-3',
          'skeleton-stats-4',
        ].map((id) => (
          <Skeleton className="h-24 sm:h-32" key={id} />
        ))}
      </div>
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Skeleton className="h-[300px] sm:h-[380px]" />
        <Skeleton className="h-[300px] sm:h-[380px]" />
      </div>
    </>
  )
}
