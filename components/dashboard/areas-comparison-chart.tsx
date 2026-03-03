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
    color: string
    expected: number
    actual: number
  }>
}

export function AreasComparisonChart({ data }: AreasComparisonChartProps) {
  if (data.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Expected vs Actual Hours</CardTitle>
          <CardDescription>Weekly goal progress by area</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">No areas configured</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Expected vs Actual Hours</CardTitle>
        <CardDescription>Weekly goal progress by area</CardDescription>
      </CardHeader>
      <CardContent>
        <AreasComparisonChartContent data={data} />
      </CardContent>
    </Card>
  )
}
