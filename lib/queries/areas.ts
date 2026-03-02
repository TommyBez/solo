import { and, desc, eq, gte } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas, projects, timeEntries } from '@/lib/db/schema'

export async function getAreas(includeArchived = false) {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  const conditions = includeArchived
    ? eq(areas.userId, session.user.id)
    : and(eq(areas.userId, session.user.id), eq(areas.archived, false))

  const result = await db.query.areas.findMany({
    where: conditions,
    orderBy: [desc(areas.createdAt)],
    with: {
      projects: {
        where: eq(projects.archived, false),
      },
    },
  })

  return result
}

export async function getAreaById(id: number) {
  const session = await getSession()
  if (!session?.user) {
    return null
  }

  return db.query.areas.findFirst({
    where: and(eq(areas.id, id), eq(areas.userId, session.user.id)),
    with: {
      projects: {
        where: eq(projects.archived, false),
        with: {
          timeEntries: true,
        },
      },
    },
  })
}

export async function getAreasWithStats() {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const areasData = await db.query.areas.findMany({
    where: and(eq(areas.userId, session.user.id), eq(areas.archived, false)),
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
      expectedHours > 0 ? Math.round((hoursThisWeek / expectedHours) * 100) : 0

    return {
      ...area,
      hoursThisWeek,
      percentageComplete,
      projectCount: area.projects.length,
    }
  })
}
