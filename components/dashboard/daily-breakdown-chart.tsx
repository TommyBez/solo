import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'
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
    isOutOfOffice: boolean
  }>
}

export function DailyBreakdownChart({ data }: DailyBreakdownChartProps) {
  const hasAnyTrackedHours = data.some((day) => day.hours > 0)
  const outOfOfficeDays = data.filter((day) => day.isOutOfOffice)

  return (
    <Card>
      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
        <CardTitle className="text-base sm:text-lg">Daily Activity</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Hours tracked per day this week
        </CardDescription>
      </CardHeader>
      {hasAnyTrackedHours || outOfOfficeDays.length > 0 ? (
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <DailyBreakdownChartContent data={data} />
          {outOfOfficeDays.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {outOfOfficeDays.map((day) => (
                <Badge key={day.date} variant="outline">
                  {day.dayName}: OOO
                </Badge>
              ))}
            </div>
          ) : null}
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
