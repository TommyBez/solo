"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts"

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
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}h`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip
                formatter={(value: number, name: string) => [`${value}h`, name === "expected" ? "Expected" : "Actual"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar dataKey="expected" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} name="Expected" />
              <Bar dataKey="actual" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
