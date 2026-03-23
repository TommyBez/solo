'use client'

import dynamic from 'next/dynamic'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const TimeDistributionChartContent = dynamic(
  () =>
    import('./time-distribution-chart-content').then((m) => ({
      default: m.TimeDistributionChartContent,
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

interface TimeDistributionChartProps {
  data: Array<{
    name: string
    hours: number
    color: string
  }>
}

export function TimeDistributionChart({ data }: TimeDistributionChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">Time by Area</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Weekly distribution across areas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-[240px] items-center justify-center p-4 pt-0 sm:h-[300px] sm:p-6 sm:pt-0">
          <p className="text-muted-foreground text-sm">
            No time tracked this week
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
        <CardTitle className="text-base sm:text-lg">Time by Area</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Weekly distribution across areas
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <TimeDistributionChartContent data={data} />
      </CardContent>
    </Card>
  )
}
