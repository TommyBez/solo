import { and, desc, eq, inArray } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas, projects, timeEntries } from '@/lib/db/schema'

// Helper to get user's area IDs for filtering
async function getUserAreaIds(userId: string): Promise<number[]> {
  const userAreas = await db
    .select({ id: areas.id })
    .from(areas)
    .where(eq(areas.userId, userId))
  return userAreas.map((a) => a.id)
}

async function getProjectsCached(
  userId: string,
  areaId?: number,
  includeArchived = false,
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('projects', 'areas', 'time-entries')
  const userAreaIds = await getUserAreaIds(userId)
  if (userAreaIds.length === 0) {
    return []
  }

  const conditions = [inArray(projects.areaId, userAreaIds)]

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
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  return getProjectsCached(session.user.id, areaId, includeArchived)
}

async function getProjectByIdCached(userId: string, id: number) {
  'use cache'
  cacheLife('minutes')
  cacheTag('projects', 'areas', 'time-entries')
  const userAreaIds = await getUserAreaIds(userId)
  if (userAreaIds.length === 0) {
    return null
  }

  return db.query.projects.findFirst({
    where: and(eq(projects.id, id), inArray(projects.areaId, userAreaIds)),
    with: {
      area: true,
      timeEntries: {
        orderBy: [desc(timeEntries.startTime)],
      },
    },
  })
}

export async function getProjectById(id: number) {
  const session = await getSession()
  if (!session?.user) {
    return null
  }

  return getProjectByIdCached(session.user.id, id)
}

async function getProjectsWithStatsCached(userId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag('projects', 'areas', 'time-entries')
  const userAreaIds = await getUserAreaIds(userId)
  if (userAreaIds.length === 0) {
    return []
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const projectsData = await db.query.projects.findMany({
    where: and(
      inArray(projects.areaId, userAreaIds),
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
    const percentageComplete =
      expectedHours > 0 ? Math.round((totalHours / expectedHours) * 100) : 0

    return {
      ...project,
      totalHours,
      hoursThisWeek,
      percentageComplete,
    }
  })
}

export async function getProjectsWithStats() {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  return getProjectsWithStatsCached(session.user.id)
}
