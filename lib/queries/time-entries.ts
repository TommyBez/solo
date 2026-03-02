import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas, projects, timeEntries } from '@/lib/db/schema'

// Helper to get user's project IDs for filtering time entries
async function getUserProjectIds(userId: string): Promise<number[]> {
  const userProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(areas, eq(projects.areaId, areas.id))
    .where(eq(areas.userId, userId))
  return userProjects.map((p) => p.id)
}

export async function getTimeEntries(projectId?: number, limit = 50) {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  const userProjectIds = await getUserProjectIds(session.user.id)
  if (userProjectIds.length === 0) {
    return []
  }

  const conditions = [inArray(timeEntries.projectId, userProjectIds)]

  if (projectId) {
    conditions.push(eq(timeEntries.projectId, projectId))
  }

  return db.query.timeEntries.findMany({
    where: and(...conditions),
    orderBy: [desc(timeEntries.startTime)],
    limit,
    with: {
      project: {
        with: {
          area: true,
        },
      },
    },
  })
}

export async function getTimeEntriesForDateRange(
  startDate: Date,
  endDate: Date,
) {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  const userProjectIds = await getUserProjectIds(session.user.id)
  if (userProjectIds.length === 0) {
    return []
  }

  return db.query.timeEntries.findMany({
    where: and(
      inArray(timeEntries.projectId, userProjectIds),
      gte(timeEntries.startTime, startDate),
      lte(timeEntries.startTime, endDate),
    ),
    orderBy: [desc(timeEntries.startTime)],
    with: {
      project: {
        with: {
          area: true,
        },
      },
    },
  })
}

export async function getDashboardStats() {
  const session = await getSession()
  if (!session?.user) {
    return {
      weeklyHours: 0,
      prevWeeklyHours: 0,
      weeklyChange: 0,
      monthlyHours: 0,
      prevMonthlyHours: 0,
      monthlyChange: 0,
      activeAreasCount: 0,
      activeProjectsCount: 0,
      totalExpectedWeeklyHours: 0,
      timeByArea: [],
      timeByProject: [],
      dailyBreakdown: [],
      areasComparison: [],
    }
  }

  const userProjectIds = await getUserProjectIds(session.user.id)

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // Helper to get time entries for a date range filtered by user's projects
  async function getFilteredTimeEntries(startDate: Date, endDate?: Date) {
    if (userProjectIds.length === 0) {
      return []
    }

    const conditions = [
      inArray(timeEntries.projectId, userProjectIds),
      gte(timeEntries.startTime, startDate),
    ]
    if (endDate) {
      conditions.push(lte(timeEntries.startTime, endDate))
    }

    return db.query.timeEntries.findMany({
      where: and(...conditions),
      with: {
        project: {
          with: {
            area: true,
          },
        },
      },
    })
  }

  // Get time entries for different periods
  const [weekEntries, prevWeekEntries, monthEntries, prevMonthEntries] =
    await Promise.all([
      getFilteredTimeEntries(weekAgo),
      getFilteredTimeEntries(twoWeeksAgo, weekAgo),
      getFilteredTimeEntries(monthAgo),
      getFilteredTimeEntries(twoMonthsAgo, monthAgo),
    ])

  // Calculate weekly totals
  const weeklyMinutes = weekEntries.reduce(
    (sum, entry) => sum + entry.durationMinutes,
    0,
  )
  const prevWeeklyMinutes = prevWeekEntries.reduce(
    (sum, entry) => sum + entry.durationMinutes,
    0,
  )
  const monthlyMinutes = monthEntries.reduce(
    (sum, entry) => sum + entry.durationMinutes,
    0,
  )
  const prevMonthlyMinutes = prevMonthEntries.reduce(
    (sum, entry) => sum + entry.durationMinutes,
    0,
  )

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): number => {
    if (previous > 0) {
      return Math.round(((current - previous) / previous) * 100)
    }
    return current > 0 ? 100 : 0
  }
  const weeklyChange = calculateChange(weeklyMinutes, prevWeeklyMinutes)
  const monthlyChange = calculateChange(monthlyMinutes, prevMonthlyMinutes)

  // Get active areas and projects count for this user
  const activeAreas = await db.query.areas.findMany({
    where: and(eq(areas.userId, session.user.id), eq(areas.archived, false)),
  })

  const userAreaIds = activeAreas.map((a) => a.id)
  const activeProjects =
    userAreaIds.length > 0
      ? await db.query.projects.findMany({
          where: and(
            inArray(projects.areaId, userAreaIds),
            eq(projects.archived, false),
            eq(projects.status, 'active'),
          ),
          with: { area: true },
        })
      : []

  // Calculate time by area for the week
  const timeByArea = weekEntries.reduce(
    (acc, entry) => {
      const areaName = entry.project.area.name
      const areaColor = entry.project.area.color
      if (!acc[areaName]) {
        acc[areaName] = { minutes: 0, color: areaColor }
      }
      acc[areaName].minutes += entry.durationMinutes
      return acc
    },
    {} as Record<string, { minutes: number; color: string }>,
  )

  // Calculate time by project for the week
  const timeByProject = weekEntries.reduce(
    (acc, entry) => {
      const projectName = entry.project.name
      const areaColor = entry.project.area.color
      if (!acc[projectName]) {
        acc[projectName] = {
          minutes: 0,
          color: areaColor,
          areaName: entry.project.area.name,
        }
      }
      acc[projectName].minutes += entry.durationMinutes
      return acc
    },
    {} as Record<string, { minutes: number; color: string; areaName: string }>,
  )

  // Daily breakdown for the week
  const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
    const dayStart = new Date(date.setHours(0, 0, 0, 0))
    const dayEnd = new Date(date.setHours(23, 59, 59, 999))

    const dayMinutes = weekEntries
      .filter(
        (entry) => entry.startTime >= dayStart && entry.startTime <= dayEnd,
      )
      .reduce((sum, entry) => sum + entry.durationMinutes, 0)

    return {
      date: dayStart.toISOString().split('T')[0],
      dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      hours: Math.round((dayMinutes / 60) * 10) / 10,
    }
  })

  // Expected vs actual for areas
  const areasComparison = activeAreas.map((area) => {
    const areaMinutes = weekEntries
      .filter((entry) => entry.project.area.id === area.id)
      .reduce((sum, entry) => sum + entry.durationMinutes, 0)

    return {
      name: area.name,
      color: area.color,
      expected: area.expectedHoursPerWeek,
      actual: Math.round((areaMinutes / 60) * 10) / 10,
    }
  })

  // Calculate total expected hours for goal tracking
  const totalExpectedWeeklyHours = activeAreas.reduce(
    (sum, area) => sum + area.expectedHoursPerWeek,
    0,
  )

  return {
    weeklyHours: Math.round((weeklyMinutes / 60) * 10) / 10,
    prevWeeklyHours: Math.round((prevWeeklyMinutes / 60) * 10) / 10,
    weeklyChange,
    monthlyHours: Math.round((monthlyMinutes / 60) * 10) / 10,
    prevMonthlyHours: Math.round((prevMonthlyMinutes / 60) * 10) / 10,
    monthlyChange,
    activeAreasCount: activeAreas.length,
    activeProjectsCount: activeProjects.length,
    totalExpectedWeeklyHours,
    timeByArea: Object.entries(timeByArea).map(([name, data]) => ({
      name,
      hours: Math.round((data.minutes / 60) * 10) / 10,
      color: data.color,
    })),
    timeByProject: Object.entries(timeByProject).map(([name, data]) => ({
      name,
      hours: Math.round((data.minutes / 60) * 10) / 10,
      color: data.color,
      areaName: data.areaName,
    })),
    dailyBreakdown,
    areasComparison,
  }
}
