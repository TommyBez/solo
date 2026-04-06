import { endOfWeek, startOfWeek, subWeeks } from 'date-fns'
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { getActiveOrganizationId, getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas, projects, timeEntries } from '@/lib/db/schema'
import { getAdjustedExpectedHours, getDateKey } from '@/lib/out-of-office'
import { getOutOfOfficeDateKeysForDateRangeByUser } from '@/lib/queries/out-of-office'
import { defaultSettings, getSettings } from '@/lib/queries/settings'

// Helper to get org's project IDs for filtering time entries
async function getOrgProjectIds(organizationId: string): Promise<number[]> {
  const orgProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(areas, eq(projects.areaId, areas.id))
    .where(eq(areas.organizationId, organizationId))
  return orgProjects.map((p) => p.id)
}

async function getTimeEntriesCached(
  organizationId: string,
  projectId?: number,
  limit = 50,
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('time-entries', 'projects', 'areas')
  const orgProjectIds = await getOrgProjectIds(organizationId)
  if (orgProjectIds.length === 0) {
    return []
  }

  const conditions = [inArray(timeEntries.projectId, orgProjectIds)]

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

export async function getTimeEntries(projectId?: number, limit = 50) {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    return []
  }

  return getTimeEntriesCached(orgId, projectId, limit)
}

async function getTimeEntriesForDateRangeCached(
  organizationId: string,
  startDateIso: string,
  endDateIso: string,
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('time-entries', 'projects', 'areas')
  const orgProjectIds = await getOrgProjectIds(organizationId)
  if (orgProjectIds.length === 0) {
    return []
  }

  const startDate = new Date(startDateIso)
  const endDate = new Date(endDateIso)

  return db.query.timeEntries.findMany({
    where: and(
      inArray(timeEntries.projectId, orgProjectIds),
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

export async function getTimeEntriesForDateRange(
  startDate: Date,
  endDate: Date,
) {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    return []
  }

  return getTimeEntriesForDateRangeCached(
    orgId,
    startDate.toISOString(),
    endDate.toISOString(),
  )
}

async function getTimeEntriesForProjectAndDateRangeCached(
  organizationId: string,
  projectId: number,
  startDateIso: string,
  endDateIso: string,
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('time-entries', 'projects')

  const orgProjectIds = await getOrgProjectIds(organizationId)
  if (!orgProjectIds.includes(projectId)) {
    return []
  }

  return db.query.timeEntries.findMany({
    where: and(
      eq(timeEntries.projectId, projectId),
      gte(timeEntries.startTime, new Date(startDateIso)),
      lte(timeEntries.startTime, new Date(endDateIso)),
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

export async function getTimeEntriesForProjectAndDateRange(
  projectId: number,
  startDate: Date,
  endDate: Date,
) {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    return []
  }

  return getTimeEntriesForProjectAndDateRangeCached(
    orgId,
    projectId,
    startDate.toISOString(),
    endDate.toISOString(),
  )
}

async function getDashboardStatsCached(
  organizationId: string,
  userId: string,
  weekStartsOn: 0 | 1,
  weekOffset = 0,
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('time-entries', 'projects', 'areas')
  const orgProjectIds = await getOrgProjectIds(organizationId)
  const now = new Date()
  const currentWeekStart = startOfWeek(now, { weekStartsOn })
  const weekStart =
    weekOffset === 0
      ? currentWeekStart
      : subWeeks(currentWeekStart, Math.abs(weekOffset))
  const weekEnd = endOfWeek(weekStart, { weekStartsOn })
  const prevWeekStart = subWeeks(weekStart, 1)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // Helper to get time entries for a date range filtered by org's projects
  async function getFilteredTimeEntries(startDate: Date, endDate?: Date) {
    if (orgProjectIds.length === 0) {
      return []
    }

    const conditions = [
      inArray(timeEntries.projectId, orgProjectIds),
      gte(timeEntries.startTime, startDate),
    ]
    if (endDate) {
      conditions.push(lte(timeEntries.startTime, endDate))
    }

    return await db.query.timeEntries.findMany({
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
      getFilteredTimeEntries(weekStart, weekEnd),
      getFilteredTimeEntries(prevWeekStart, weekStart),
      getFilteredTimeEntries(monthAgo),
      getFilteredTimeEntries(twoMonthsAgo, monthAgo),
    ])
  const outOfOfficeDateKeys = await getOutOfOfficeDateKeysForDateRangeByUser(
    organizationId,
    userId,
    weekStart,
    weekEnd,
  )

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

  // Get active areas and projects count for this org
  const activeAreas = await db.query.areas.findMany({
    where: and(
      eq(areas.organizationId, organizationId),
      eq(areas.archived, false),
    ),
  })

  const orgAreaIds = activeAreas.map((a) => a.id)
  const activeProjects =
    orgAreaIds.length > 0
      ? await db.query.projects.findMany({
          where: and(
            inArray(projects.areaId, orgAreaIds),
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

  // Daily breakdown for the week (from week start day through end of week)
  const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const dayMinutes = weekEntries
      .filter(
        (entry) => entry.startTime >= dayStart && entry.startTime <= dayEnd,
      )
      .reduce((sum, entry) => sum + entry.durationMinutes, 0)
    const dateKey = getDateKey(dayStart)

    return {
      date: dateKey,
      dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      hours: Math.round((dayMinutes / 60) * 10) / 10,
      isOutOfOffice: outOfOfficeDateKeys.includes(dateKey),
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
      expected: getAdjustedExpectedHours(
        area.expectedHoursPerWeek,
        outOfOfficeDateKeys,
        weekStart,
        weekEnd,
      ),
      actual: Math.round((areaMinutes / 60) * 10) / 10,
    }
  })

  // Calculate total expected hours for goal tracking
  const totalExpectedWeeklyHours = activeAreas.reduce(
    (sum, area) => sum + area.expectedHoursPerWeek,
    0,
  )
  const adjustedExpectedWeeklyHours = getAdjustedExpectedHours(
    totalExpectedWeeklyHours,
    outOfOfficeDateKeys,
    weekStart,
    weekEnd,
  )
  const result = {
    weekStartDate: weekStart.toISOString(),
    weeklyHours: Math.round((weeklyMinutes / 60) * 10) / 10,
    prevWeeklyHours: Math.round((prevWeeklyMinutes / 60) * 10) / 10,
    weeklyChange,
    monthlyHours: Math.round((monthlyMinutes / 60) * 10) / 10,
    prevMonthlyHours: Math.round((prevMonthlyMinutes / 60) * 10) / 10,
    monthlyChange,
    activeAreasCount: activeAreas.length,
    activeProjectsCount: activeProjects.length,
    totalExpectedWeeklyHours: adjustedExpectedWeeklyHours,
    outOfOfficeDaysCount: outOfOfficeDateKeys.length,
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
  return result
}

export async function getDashboardStats(weekOffset = 0) {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    return {
      weekStartDate: new Date().toISOString(),
      weeklyHours: 0,
      prevWeeklyHours: 0,
      weeklyChange: 0,
      monthlyHours: 0,
      prevMonthlyHours: 0,
      monthlyChange: 0,
      activeAreasCount: 0,
      activeProjectsCount: 0,
      totalExpectedWeeklyHours: 0,
      outOfOfficeDaysCount: 0,
      timeByArea: [],
      timeByProject: [],
      dailyBreakdown: [],
      areasComparison: [],
    }
  }

  const session = await getSession()
  const settings = session?.user
    ? await getSettings(session.user.id)
    : defaultSettings
  const weekStartsOn = settings.weekStartsOn === '0' ? 0 : 1

  if (!session?.user) {
    return {
      weekStartDate: new Date().toISOString(),
      weeklyHours: 0,
      prevWeeklyHours: 0,
      weeklyChange: 0,
      monthlyHours: 0,
      prevMonthlyHours: 0,
      monthlyChange: 0,
      activeAreasCount: 0,
      activeProjectsCount: 0,
      totalExpectedWeeklyHours: 0,
      outOfOfficeDaysCount: 0,
      timeByArea: [],
      timeByProject: [],
      dailyBreakdown: [],
      areasComparison: [],
    }
  }

  return getDashboardStatsCached(
    orgId,
    session.user.id,
    weekStartsOn,
    weekOffset,
  )
}
