'use client'

import dynamic from 'next/dynamic'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const DailyBreakdownChartContent = dynamic(
  () =>
    import('./daily-breakdown-chart-content').then((m) => ({
      default: m.DailyBreakdownChartContent,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    ),
  },
)

interface DailyBreakdownChartProps {
  data: Array<{
    date: string
    dayName: string
    hours: number
  }>
}

export function DailyBreakdownChart({ data }: DailyBreakdownChartProps) {
  const hasAnyTrackedHours = data.some((day) => day.hours > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Activity</CardTitle>
        <CardDescription>Hours tracked per day this week</CardDescription>
      </CardHeader>
      {hasAnyTrackedHours ? (
        <CardContent>
          <DailyBreakdownChartContent data={data} />
        </CardContent>
      ) : (
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">No time tracked this week</p>
        </CardContent>
      )}
    </Card>
  )
}
