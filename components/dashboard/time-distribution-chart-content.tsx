'use client'

import { Cell, Pie, PieChart } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface TimeDistributionChartContentProps {
  data: Array<{
    name: string
    hours: number
    color: string
  }>
}

export function TimeDistributionChartContent({
  data,
}: TimeDistributionChartContentProps) {
  const chartConfig = {
    hours: {
      label: 'Hours',
    },
  }

  return (
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
          label={({ name, percent }: { name: string; percent?: number }) =>
            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
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
  )
}
