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

interface DailyBreakdownChartProps {
  data: Array<{
    date: string
    dayName: string
    hours: number
  }>
}

export function DailyBreakdownChart({ data }: DailyBreakdownChartProps) {
  const chartConfig = {
    hours: {
      label: 'Hours',
      color: 'var(--primary)',
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Activity</CardTitle>
        <CardDescription>Hours tracked per day this week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="aspect-auto h-[300px] w-full"
          config={chartConfig}
        >
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid className="stroke-muted" strokeDasharray="3 3" />
            <XAxis
              axisLine={false}
              dataKey="dayName"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value: number | string) => `${value}h`}
              tickLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="hours"
              fill="var(--color-hours)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
