'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

type ChartComponent = ComponentType<Record<string, unknown>>

const Bar = dynamic<Record<string, unknown>>(
  () => import('recharts').then((mod) => mod.Bar as unknown as ChartComponent),
  { ssr: false },
)
const BarChart = dynamic(
  () =>
    import('recharts').then((mod) => mod.BarChart as unknown as ChartComponent),
  { ssr: false },
)
const CartesianGrid = dynamic(
  () =>
    import('recharts').then(
      (mod) => mod.CartesianGrid as unknown as ChartComponent,
    ),
  { ssr: false },
)
const XAxis = dynamic(
  () =>
    import('recharts').then((mod) => mod.XAxis as unknown as ChartComponent),
  { ssr: false },
)
const YAxis = dynamic(
  () =>
    import('recharts').then((mod) => mod.YAxis as unknown as ChartComponent),
  { ssr: false },
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
  const chartConfig = {
    expected: {
      label: 'Expected',
      color: 'var(--muted-foreground)',
    },
    actual: {
      label: 'Actual',
      color: 'var(--primary)',
    },
  }

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
        <ChartContainer
          className="aspect-auto h-[300px] w-full"
          config={chartConfig}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
          >
            <CartesianGrid
              className="stroke-muted"
              horizontal={false}
              strokeDasharray="3 3"
            />
            <XAxis
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value: number | string) => `${value}h`}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              type="category"
              width={70}
            />
            <ChartTooltip content={<ChartTooltipContent labelKey="name" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="expected"
              fill="var(--color-expected)"
              name="Expected"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="actual"
              fill="var(--color-actual)"
              name="Actual"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
