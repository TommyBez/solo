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

const Cell = dynamic<Record<string, unknown>>(
  () => import('recharts').then((mod) => mod.Cell as unknown as ChartComponent),
  { ssr: false },
)
const Pie = dynamic(
  () => import('recharts').then((mod) => mod.Pie as unknown as ChartComponent),
  { ssr: false },
)
const PieChart = dynamic(
  () =>
    import('recharts').then((mod) => mod.PieChart as unknown as ChartComponent),
  { ssr: false },
)

interface TimeDistributionChartProps {
  data: Array<{
    name: string
    hours: number
    color: string
  }>
}

export function TimeDistributionChart({ data }: TimeDistributionChartProps) {
  const chartConfig = {
    hours: {
      label: 'Hours',
    },
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time by Area</CardTitle>
          <CardDescription>Weekly distribution across areas</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">No time tracked this week</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time by Area</CardTitle>
        <CardDescription>Weekly distribution across areas</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="aspect-auto h-[300px] w-full"
          config={chartConfig}
        >
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={data}
              dataKey="hours"
              innerRadius={60}
              label={({ name, percent }: { name: string; percent: number }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={false}
              nameKey="name"
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell fill={entry.color} key={`cell-${entry.name}`} />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent labelKey="name" nameKey="name" />}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
