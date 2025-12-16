"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
      label: "Expected",
      color: "var(--muted-foreground)",
    },
    actual: {
      label: "Actual",
      color: "var(--primary)",
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
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}h`}
            />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={70} />
            <ChartTooltip content={<ChartTooltipContent labelKey="name" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="expected" fill="var(--color-expected)" radius={[0, 4, 4, 0]} name="Expected" />
            <Bar dataKey="actual" fill="var(--color-actual)" radius={[0, 4, 4, 0]} name="Actual" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
