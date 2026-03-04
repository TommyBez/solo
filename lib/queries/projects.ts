import { and, desc, eq, inArray } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { getActiveOrganizationId } from '@/lib/auth/session'

const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

import { db } from '@/lib/db'
import { areas, projects } from '@/lib/db/schema'

// Helper to get org's area IDs for filtering
async function getOrgAreaIds(organizationId: string): Promise<number[]> {
  const orgAreas = await db
    .select({ id: areas.id })
    .from(areas)
    .where(eq(areas.organizationId, organizationId))
  return orgAreas.map((a) => a.id)
}

async function getProjectsCached(
  organizationId: string,
  areaId?: number,
  includeArchived = false,
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('projects', 'areas', 'time-entries')
  const orgAreaIds = await getOrgAreaIds(organizationId)
  if (orgAreaIds.length === 0) {
    return []
  }

  const conditions = [inArray(projects.areaId, orgAreaIds)]

  if (areaId) {
    conditions.push(eq(projects.areaId, areaId))
  }

  if (!includeArchived) {
    conditions.push(eq(projects.archived, false))
  }

  return db.query.projects.findMany({
    where: and(...conditions),
    orderBy: [desc(projects.createdAt)],
    with: {
      area: true,
      timeEntries: true,
    },
  })
}

export async function getProjects(areaId?: number, includeArchived = false) {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    return []
  }

  return getProjectsCached(orgId, areaId, includeArchived)
}

async function getProjectsWithStatsCached(organizationId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag('projects', 'areas', 'time-entries')
  const orgAreaIds = await getOrgAreaIds(organizationId)
  if (orgAreaIds.length === 0) {
    return []
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - MILLISECONDS_PER_WEEK)

  const projectsData = await db.query.projects.findMany({
    where: and(
      inArray(projects.areaId, orgAreaIds),
      eq(projects.archived, false),
    ),
    orderBy: [desc(projects.createdAt)],
    with: {
      area: true,
      timeEntries: true,
    },
  })

  return projectsData.map((project) => {
    const totalMinutes = project.timeEntries.reduce(
      (sum, entry) => sum + entry.durationMinutes,
      0,
    )
    const weekMinutes = project.timeEntries
      .filter((entry) => entry.startTime >= weekAgo)
      .reduce((sum, entry) => sum + entry.durationMinutes, 0)

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10
    const hoursThisWeek = Math.round((weekMinutes / 60) * 10) / 10
    const expectedHours = project.expectedHours
    const progressHours = project.recurring ? hoursThisWeek : totalHours
    const percentageComplete =
      expectedHours > 0 ? Math.round((progressHours / expectedHours) * 100) : 0

    return {
      ...project,
      totalHours,
      hoursThisWeek,
      progressHours,
      percentageComplete,
    }
  })
}

export async function getProjectsWithStats() {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    return []
  }

  return getProjectsWithStatsCached(orgId)
}
