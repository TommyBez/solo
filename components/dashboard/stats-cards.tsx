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
  totalExpectedWeeklyHours: number
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
  totalExpectedWeeklyHours,
}: StatsCardsProps) {
  const avgDailyHours = Math.round((weeklyHours / 7) * 10) / 10
  const goalProgress =
    totalExpectedWeeklyHours > 0
      ? Math.round((weeklyHours / totalExpectedWeeklyHours) * 100)
      : 0
  const isOnTrack = goalProgress >= 70 // Consider "on track" if at least 70% of goal

  return (
    <div className="stagger-children grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-primary/5 ring-primary/20 dark:bg-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">This Week</CardTitle>
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
            <Clock className="size-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="font-bold font-mono text-2xl tabular-nums">{weeklyHours}h</div>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-xs">
              ~{avgDailyHours}h daily average
            </p>
            <TrendIndicator change={weeklyChange} label="vs last week" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">This Month</CardTitle>
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <Target className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="font-bold font-mono text-2xl tabular-nums">{monthlyHours}h</div>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-xs">Total tracked time</p>
            <TrendIndicator change={monthlyChange} label="vs last month" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Weekly Goal</CardTitle>
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <Layers className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="font-bold font-mono text-2xl tabular-nums">
            {totalExpectedWeeklyHours > 0 ? `${goalProgress}%` : '—'}
          </div>
          <div className="flex flex-col gap-1">
            {totalExpectedWeeklyHours > 0 ? (
              <>
                <Progress className="my-1 h-2" value={Math.min(goalProgress, 100)} />
                <p className="text-muted-foreground text-xs">
                  {weeklyHours}h / {totalExpectedWeeklyHours}h target
                </p>
                <span
                  className={cn(
                    'text-xs',
                    isOnTrack ? 'text-success' : 'text-destructive',
                  )}
                >
                  {isOnTrack ? 'On track' : 'Behind schedule'}
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Active Work</CardTitle>
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <FolderKanban className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="font-bold font-mono text-2xl tabular-nums">{activeProjectsCount}</div>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-xs">
              projects across {activeAreasCount} areas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
