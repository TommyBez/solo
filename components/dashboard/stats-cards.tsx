import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Layers, FolderKanban, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  weeklyHours: number
  monthlyHours: number
  activeAreasCount: number
  activeProjectsCount: number
}

export function StatsCards({ weeklyHours, monthlyHours, activeAreasCount, activeProjectsCount }: StatsCardsProps) {
  const avgDailyHours = Math.round((weeklyHours / 7) * 10) / 10

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <Clock className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{weeklyHours}h</div>
          <p className="text-xs text-muted-foreground">~{avgDailyHours}h daily average</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <TrendingUp className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{monthlyHours}h</div>
          <p className="text-xs text-muted-foreground">Total tracked time</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Areas</CardTitle>
          <Layers className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeAreasCount}</div>
          <p className="text-xs text-muted-foreground">Broad focus contexts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <FolderKanban className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjectsCount}</div>
          <p className="text-xs text-muted-foreground">Ongoing endeavors</p>
        </CardContent>
      </Card>
    </div>
  )
}
