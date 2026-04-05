import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  FolderKanban,
  Layers,
  Minus,
  Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  activeAreasCount: number
  activeProjectsCount: number
  monthlyChange: number
  monthlyHours: number
  outOfOfficeDaysCount: number
  totalExpectedWeeklyHours: number
  weekLabel?: string
  weeklyChange: number
  weeklyHours: number
}

function TrendIndicator({ change, label }: { change: number; label: string }) {
  if (change === 0) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-xs">
        <Minus className="size-3" />
        No change {label}
      </span>
    )
  }

  const isPositive = change > 0
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs',
        isPositive ? 'text-success' : 'text-destructive',
      )}
    >
      <Icon className="size-3" />
      {isPositive ? '+' : ''}
      {change}% {label}
    </span>
  )
}

export function StatsCards({
  weeklyHours,
  weeklyChange,
  monthlyHours,
  monthlyChange,
  activeAreasCount,
  activeProjectsCount,
  outOfOfficeDaysCount,
  totalExpectedWeeklyHours,
  weekLabel,
}: StatsCardsProps) {
  const avgDailyHours = Math.round((weeklyHours / 7) * 10) / 10
  const goalProgress =
    totalExpectedWeeklyHours > 0
      ? Math.round((weeklyHours / totalExpectedWeeklyHours) * 100)
      : 0
  const isOnTrack = goalProgress >= 70 // Consider "on track" if at least 70% of goal

  return (
    <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Card className="bg-primary/5 ring-primary/20 dark:bg-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="font-medium text-xs sm:text-sm">
            {weekLabel ?? 'This Week'}
          </CardTitle>
          <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 sm:size-8">
            <Clock className="size-3 text-primary sm:size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="font-bold font-mono text-lg tabular-nums sm:text-2xl">
            {weeklyHours}h
          </div>
          <div className="flex flex-col gap-1">
            <p className="hidden text-muted-foreground text-xs sm:block">
              ~{avgDailyHours}h daily average
            </p>
            <TrendIndicator change={weeklyChange} label="vs last week" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="font-medium text-xs sm:text-sm">
            This Month
          </CardTitle>
          <div className="flex size-6 items-center justify-center rounded-md bg-muted sm:size-8">
            <Target className="size-3 text-muted-foreground sm:size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="font-bold font-mono text-lg tabular-nums sm:text-2xl">
            {monthlyHours}h
          </div>
          <div className="flex flex-col gap-1">
            <p className="hidden text-muted-foreground text-xs sm:block">
              Total tracked time
            </p>
            <TrendIndicator change={monthlyChange} label="vs last month" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="font-medium text-xs sm:text-sm">
            Weekly Goal
          </CardTitle>
          <div className="flex size-6 items-center justify-center rounded-md bg-muted sm:size-8">
            <Layers className="size-3 text-muted-foreground sm:size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="font-bold font-mono text-lg tabular-nums sm:text-2xl">
            {totalExpectedWeeklyHours > 0 ? `${goalProgress}%` : '—'}
          </div>
          <div className="flex flex-col gap-1">
            {totalExpectedWeeklyHours > 0 ? (
              <>
                <Progress
                  className="my-1 h-2"
                  value={Math.min(goalProgress, 100)}
                />
                <p className="hidden text-muted-foreground text-xs sm:block">
                  {weeklyHours}h / {totalExpectedWeeklyHours}h target
                </p>
                {outOfOfficeDaysCount > 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Adjusted for {outOfOfficeDaysCount} out-of-office{' '}
                    {outOfOfficeDaysCount === 1 ? 'day' : 'days'}
                  </p>
                ) : null}
                <span
                  className={cn(
                    'text-xs',
                    isOnTrack ? 'text-success' : 'text-destructive',
                  )}
                >
                  {isOnTrack ? 'On track' : 'Behind'}
                </span>
              </>
            ) : (
              <p className="text-muted-foreground text-xs">
                Set goals in Areas
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="font-medium text-xs sm:text-sm">
            Active Work
          </CardTitle>
          <div className="flex size-6 items-center justify-center rounded-md bg-muted sm:size-8">
            <FolderKanban className="size-3 text-muted-foreground sm:size-4" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="font-bold font-mono text-lg tabular-nums sm:text-2xl">
            {activeProjectsCount}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-xs">
              <span className="hidden sm:inline">projects across </span>
              {activeAreasCount} areas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
