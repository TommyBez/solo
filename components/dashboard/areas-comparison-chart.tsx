import dynamic from 'next/dynamic'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const AreasComparisonChartContent = dynamic(
  () =>
    import('./areas-comparison-chart-content').then((m) => ({
      default: m.AreasComparisonChartContent,
    })),
  {
    loading: () => (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    ),
  },
)

interface AreasComparisonChartProps {
  data: Array<{
    name: string
    expected: number
    actual: number
  }>
  outOfOfficeDaysCount: number
}

export function AreasComparisonChart({
  data,
  outOfOfficeDaysCount,
}: AreasComparisonChartProps) {
  if (data.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">
            Expected vs Actual Hours
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Weekly goal progress by area
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-[240px] items-center justify-center p-4 pt-0 sm:h-[300px] sm:p-6 sm:pt-0">
          <p className="text-muted-foreground text-sm">No areas configured</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
        <CardTitle className="text-base sm:text-lg">
          Expected vs Actual Hours
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {outOfOfficeDaysCount > 0
            ? 'Weekly goal progress by area, adjusted for out-of-office days'
            : 'Weekly goal progress by area'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <AreasComparisonChartContent data={data} />
      </CardContent>
    </Card>
  )
}
