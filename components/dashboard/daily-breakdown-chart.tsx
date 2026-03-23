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
      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
        <CardTitle className="text-base sm:text-lg">Daily Activity</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Hours tracked per day this week
        </CardDescription>
      </CardHeader>
      {hasAnyTrackedHours ? (
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <DailyBreakdownChartContent data={data} />
        </CardContent>
      ) : (
        <CardContent className="flex h-[240px] items-center justify-center p-4 pt-0 sm:h-[300px] sm:p-6 sm:pt-0">
          <p className="text-muted-foreground text-sm">
            No time tracked this week
          </p>
        </CardContent>
      )}
    </Card>
  )
}
