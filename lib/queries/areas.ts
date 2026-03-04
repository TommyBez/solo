import { and, desc, eq, gte } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { getActiveOrganizationId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas, projects, timeEntries } from '@/lib/db/schema'

async function getAreasCached(
  organizationId: string,
  includeArchived: boolean,
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('areas', 'projects')
  const conditions = includeArchived
    ? eq(areas.organizationId, organizationId)
    : and(
        eq(areas.organizationId, organizationId),
        eq(areas.archived, false),
      )

  return await db.query.areas.findMany({
    where: conditions,
    orderBy: [desc(areas.createdAt)],
    with: {
      projects: {
        where: eq(projects.archived, false),
      },
    },
  })
}

export async function getAreas(includeArchived = false) {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    return []
  }

  return getAreasCached(orgId, includeArchived)
}

async function getAreasWithStatsCached(organizationId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag('areas', 'projects', 'time-entries')
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const areasData = await db.query.areas.findMany({
    where: and(
      eq(areas.organizationId, organizationId),
      eq(areas.archived, false),
    ),
    orderBy: [desc(areas.createdAt)],
    with: {
      projects: {
        where: eq(projects.archived, false),
        with: {
          timeEntries: {
            where: gte(timeEntries.startTime, weekAgo),
          },
        },
      },
    },
  })

  return areasData.map((area) => {
    const totalMinutesThisWeek = area.projects.reduce(
      (acc, project) =>
        acc +
        project.timeEntries.reduce(
          (sum, entry) => sum + entry.durationMinutes,
          0,
        ),
      0,
    )

    const hoursThisWeek = Math.round((totalMinutesThisWeek / 60) * 10) / 10
    const expectedHours = area.expectedHoursPerWeek
    const percentageComplete =
      expectedHours > 0
        ? Math.round((hoursThisWeek / expectedHours) * 100)
        : 0

    return {
      ...area,
      hoursThisWeek,
      percentageComplete,
      projectCount: area.projects.length,
    }
  })
}

export async function getAreasWithStats() {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    return []
  }

  return getAreasWithStatsCached(orgId)
}
