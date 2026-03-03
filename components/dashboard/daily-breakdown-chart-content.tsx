'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface DailyBreakdownChartContentProps {
  data: Array<{
    date: string
    dayName: string
    hours: number
  }>
}

const chartConfig = {
  hours: {
    label: 'Hours',
    color: 'var(--primary)',
  },
}

export function DailyBreakdownChartContent({
  data,
}: DailyBreakdownChartContentProps) {
  return (
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
        <Bar dataKey="hours" fill="var(--color-hours)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
