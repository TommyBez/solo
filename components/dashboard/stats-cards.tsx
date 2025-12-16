import { Clock, FolderKanban, Layers, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatsCardsProps {
  weeklyHours: number
  monthlyHours: number
  activeAreasCount: number
  activeProjectsCount: number
}

export function StatsCards({
  weeklyHours,
  monthlyHours,
  activeAreasCount,
  activeProjectsCount,
}: StatsCardsProps) {
  const avgDailyHours = Math.round((weeklyHours / 7) * 10) / 10

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">This Week</CardTitle>
          <Clock className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{weeklyHours}h</div>
          <p className="text-muted-foreground text-xs">
            ~{avgDailyHours}h daily average
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">This Month</CardTitle>
          <TrendingUp className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{monthlyHours}h</div>
          <p className="text-muted-foreground text-xs">Total tracked time</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Active Areas</CardTitle>
          <Layers className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{activeAreasCount}</div>
          <p className="text-muted-foreground text-xs">Broad focus contexts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Active Projects</CardTitle>
          <FolderKanban className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{activeProjectsCount}</div>
          <p className="text-muted-foreground text-xs">Ongoing endeavors</p>
        </CardContent>
      </Card>
    </div>
  )
}
