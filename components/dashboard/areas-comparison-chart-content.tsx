'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface AreasComparisonChartContentProps {
  data: Array<{
    name: string
    expected: number
    actual: number
  }>
}

export function AreasComparisonChartContent({
  data,
}: AreasComparisonChartContentProps) {
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

  return (
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
  )
}
