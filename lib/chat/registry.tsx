'use client'

import { defineRegistry } from '@json-render/react'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  Clock,
  FolderKanban,
  Info,
  Layers,
  Mail,
  Phone,
  Target,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { ColorBar, ColorDot } from '@/components/color-indicator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { catalog } from './catalog'

// Lazy-load chart components (they use Recharts which is heavy)
const DailyBreakdownChartContent = dynamic(
  () =>
    import('@/components/dashboard/daily-breakdown-chart-content').then(
      (m) => ({ default: m.DailyBreakdownChartContent }),
    ),
  { ssr: false },
)

const AreasComparisonChartContent = dynamic(
  () =>
    import('@/components/dashboard/areas-comparison-chart-content').then(
      (m) => ({ default: m.AreasComparisonChartContent }),
    ),
  { ssr: false },
)

const TimeDistributionChartContent = dynamic(
  () =>
    import('@/components/dashboard/time-distribution-chart-content').then(
      (m) => ({ default: m.TimeDistributionChartContent }),
    ),
  { ssr: false },
)

// ── Helpers ────────────────────────────────────────────────────────────

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) {
    return `${mins}m`
  }
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}m`
}

const gapMap = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' } as const

const avatarColors = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-violet-600',
  'bg-cyan-600',
  'bg-pink-600',
  'bg-teal-600',
]

// ── Registry ───────────────────────────────────────────────────────────

export const { registry } = defineRegistry(catalog, {
  components: {
    // ── Business components ─────────────────────────────────────────

    StatsCards: ({ props }) => {
      const avgDailyHours = Math.round((props.weeklyHours / 7) * 10) / 10
      const goalProgress =
        props.adjustedExpectedWeeklyHours > 0
          ? Math.round(
              (props.weeklyHours / props.adjustedExpectedWeeklyHours) * 100,
            )
          : 0

      function TrendBadge({
        change,
        label,
      }: {
        change: number
        label: string
      }) {
        if (change === 0) {
          return (
            <span className="text-muted-foreground text-xs">
              No change {label}
            </span>
          )
        }
        return (
          <span
            className={cn(
              'text-xs',
              change > 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {change > 0 ? '+' : ''}
            {change}% {label}
          </span>
        )
      }

      return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card className="bg-primary/5 dark:bg-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="font-medium text-xs sm:text-sm">
                {props.weekLabel ?? 'This Week'}
              </CardTitle>
              <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 sm:size-8">
                <Clock className="size-3 text-primary sm:size-4" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="font-bold font-mono text-lg tabular-nums sm:text-2xl">
                {props.weeklyHours}h
              </div>
              <p className="text-muted-foreground text-xs">
                ~{avgDailyHours}h daily average
              </p>
              <TrendBadge change={props.weeklyChange} label="vs last week" />
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
                {props.monthlyHours}h
              </div>
              <TrendBadge change={props.monthlyChange} label="vs last month" />
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
                {props.adjustedExpectedWeeklyHours > 0 ? `${goalProgress}%` : '—'}
              </div>
              {props.adjustedExpectedWeeklyHours > 0 && (
                <>
                  <Progress
                    className="my-1 h-2"
                    value={Math.min(goalProgress, 100)}
                  />
                  <p className="text-muted-foreground text-xs">
                    {props.weeklyHours}h / {props.adjustedExpectedWeeklyHours}h
                    target
                  </p>
                  {props.outOfOfficeDays > 0 ? (
                    <p className="text-muted-foreground text-xs">
                      Adjusted for {props.outOfOfficeDays} out-of-office
                      {props.outOfOfficeDays === 1 ? ' day' : ' days'}
                    </p>
                  ) : null}
                </>
              )}
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
                {props.activeProjectsCount}
              </div>
              <p className="text-muted-foreground text-xs">
                projects across {props.activeAreasCount} areas
              </p>
            </CardContent>
          </Card>
        </div>
      )
    },

    DailyBreakdown: ({ props }) => (
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">
            Daily Breakdown
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Hours tracked per day
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {props.data.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No data available
            </p>
          ) : (
            <DailyBreakdownChartContent data={props.data} />
          )}
        </CardContent>
      </Card>
    ),

    AreasComparison: ({ props }) => (
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">
            Expected vs Actual Hours
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Weekly goal progress by area
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {props.data.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No areas configured
            </p>
          ) : (
            <AreasComparisonChartContent data={props.data} />
          )}
        </CardContent>
      </Card>
    ),

    TimeDistribution: ({ props }) => (
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">Time by Area</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Distribution across areas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {props.data.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No time tracked
            </p>
          ) : (
            <TimeDistributionChartContent data={props.data} />
          )}
        </CardContent>
      </Card>
    ),

    RecentEntries: ({ props }) => (
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">Time Entries</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {props.entries.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
          {props.entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Clock className="mb-2 size-5 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No entries found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {props.entries.map((entry) => (
                <div
                  className="flex items-start justify-between gap-2 rounded-lg border p-2 sm:gap-4 sm:p-3"
                  key={entry.id}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <ColorDot color={entry.areaColor} />
                      <span className="truncate font-medium text-xs sm:text-sm">
                        {entry.projectName}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="line-clamp-1 text-muted-foreground text-xs sm:text-sm">
                        {entry.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground sm:text-xs">
                      {formatDistanceToNow(new Date(entry.startTime), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Badge
                    className="shrink-0 font-mono text-[10px] tabular-nums sm:text-xs"
                    variant="secondary"
                  >
                    {formatDuration(entry.durationMinutes)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),

    ProjectCard: ({ props }) => {
      const progress =
        props.expectedHours > 0
          ? Math.round((props.totalHours / props.expectedHours) * 100)
          : 0
      let statusVariant: 'default' | 'outline' | 'secondary'
      if (props.status === 'active') {
        statusVariant = 'default'
      } else if (props.status === 'completed') {
        statusVariant = 'secondary'
      } else {
        statusVariant = 'outline'
      }

      return (
        <Card className="relative overflow-hidden">
          <ColorBar color={props.areaColor} />
          <CardHeader className="p-3 pb-1 pl-5 sm:p-4 sm:pb-1 sm:pl-6">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-sm sm:text-base">
                  {props.name}
                </CardTitle>
                {props.description && (
                  <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                    {props.description}
                  </CardDescription>
                )}
              </div>
              <Badge className="ml-2 shrink-0" variant={statusVariant}>
                {props.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-1 pl-5 sm:p-4 sm:pt-1 sm:pl-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>{props.areaName}</span>
              {props.clientName && (
                <>
                  <span>&middot;</span>
                  <span>{props.clientName}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono tabular-nums">
                {props.totalHours}h total
              </span>
              <span className="text-muted-foreground">&middot;</span>
              <span className="font-mono tabular-nums">
                {props.hoursThisWeek}h this week
              </span>
            </div>
            {props.expectedHours > 0 && (
              <div className="space-y-1">
                <Progress className="h-1.5" value={Math.min(progress, 100)} />
                <p className="text-[10px] text-muted-foreground">
                  {props.totalHours}h / {props.expectedHours}h expected
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )
    },

    ClientCard: ({ props }) => {
      const colorIndex =
        props.name
          .split('')
          .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        avatarColors.length
      const initials = props.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

      return (
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full font-medium text-white text-xs',
                  avatarColors[colorIndex],
                )}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-sm sm:text-base">
                  {props.name}
                </CardTitle>
                {props.hourlyRate && (
                  <CardDescription className="text-xs">
                    {props.currency} {props.hourlyRate}/hr
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-0 sm:p-4 sm:pt-0">
            {props.email && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Mail className="size-3" />
                <span className="truncate">{props.email}</span>
              </div>
            )}
            {props.phone && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Phone className="size-3" />
                <span>{props.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-xs">
              <span>
                {props.projectCount} project
                {props.projectCount !== 1 ? 's' : ''}
              </span>
              <span className="text-muted-foreground">&middot;</span>
              <span className="font-mono tabular-nums">
                {props.totalBillableHours}h billable
              </span>
            </div>
          </CardContent>
        </Card>
      )
    },

    AreaCard: ({ props }) => (
      <Card className="relative overflow-hidden">
        <ColorBar color={props.color} />
        <CardHeader className="p-3 pb-1 pl-5 sm:p-4 sm:pb-1 sm:pl-6">
          <CardTitle className="truncate text-sm sm:text-base">
            {props.name}
          </CardTitle>
          {props.description && (
            <CardDescription className="mt-0.5 line-clamp-2 text-xs">
              {props.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-1 pl-5 sm:p-4 sm:pt-1 sm:pl-6">
          <div className="space-y-1">
            <Progress
              className="h-1.5"
              value={Math.min(props.percentageComplete, 100)}
            />
            <p className="text-[10px] text-muted-foreground">
              {props.hoursThisWeek}h / {props.expectedHoursPerWeek}h weekly
              target
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <FolderKanban className="size-3" />
            <span>
              {props.projectCount} project
              {props.projectCount !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>
    ),

    // ── Generic primitives ──────────────────────────────────────────

    Card: ({ props, children }) => (
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">{props.title}</CardTitle>
          {props.description && (
            <CardDescription className="text-xs sm:text-sm">
              {props.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
          {children}
        </CardContent>
      </Card>
    ),

    Table: ({ props }) => (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {props.columns.map((col) => (
                <TableHead
                  className={cn(
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                  key={col.key}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.rows.map((row) => (
              <TableRow
                key={props.columns
                  .map((c) => String(row[c.key] ?? ''))
                  .join('|')}
              >
                {props.columns.map((col) => (
                  <TableCell
                    className={cn(
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                    )}
                    key={col.key}
                  >
                    {String(row[col.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ),

    Text: ({ props }) => (
      <p
        className={cn(
          'text-sm',
          props.variant === 'muted' && 'text-muted-foreground',
          props.variant === 'success' && 'text-success',
          props.variant === 'destructive' && 'text-destructive',
        )}
      >
        {props.content}
      </p>
    ),

    Heading: ({ props }) => {
      const Tag = props.level
      return (
        <Tag
          className={cn(
            'font-semibold tracking-tight',
            props.level === 'h2' && 'text-xl',
            props.level === 'h3' && 'text-lg',
            props.level === 'h4' && 'text-base',
          )}
        >
          {props.content}
        </Tag>
      )
    },

    Badge: ({ props }) => <Badge variant={props.variant}>{props.text}</Badge>,

    Progress: ({ props }) => (
      <div className="space-y-1">
        {props.label && (
          <p className="text-muted-foreground text-xs">{props.label}</p>
        )}
        <Progress className="h-2" value={props.value} />
      </div>
    ),

    Stack: ({ props, children }) => (
      <div
        className={cn(
          'flex',
          props.direction === 'vertical' ? 'flex-col' : 'flex-row',
          gapMap[props.gap],
          props.align === 'start' && 'items-start',
          props.align === 'center' && 'items-center',
          props.align === 'end' && 'items-end',
          (!props.align || props.align === 'stretch') && 'items-stretch',
        )}
      >
        {children}
      </div>
    ),

    Grid: ({ props, children }) => (
      <div
        className={cn(
          'grid',
          props.columns === '1' && 'grid-cols-1',
          props.columns === '2' && 'grid-cols-1 sm:grid-cols-2',
          props.columns === '3' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          props.columns === '4' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
          gapMap[props.gap],
        )}
      >
        {children}
      </div>
    ),

    Alert: ({ props }) => (
      <Alert variant={props.variant}>
        {props.variant === 'destructive' ? (
          <AlertCircle className="size-4" />
        ) : (
          <Info className="size-4" />
        )}
        <AlertTitle>{props.title}</AlertTitle>
        <AlertDescription>{props.description}</AlertDescription>
      </Alert>
    ),

    Separator: () => <Separator />,
  },
})
