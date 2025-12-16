'use client'

import { Cell, Pie, PieChart } from 'recharts'
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
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              labelLine={false}
              nameKey="name"
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell fill={entry.color} key={`cell-${index}`} />
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
