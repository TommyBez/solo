import { and, desc, eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas, projects, timeEntries } from '@/lib/db/schema'

export async function getProjects(areaId?: number, includeArchived = false) {
  const session = await getSession()
  if (!session?.user) return []

  // Get all projects through areas that belong to this user
  const result = await db.query.projects.findMany({
    where: areaId
      ? includeArchived
        ? eq(projects.areaId, areaId)
        : and(eq(projects.areaId, areaId), eq(projects.archived, false))
      : includeArchived
        ? undefined
        : eq(projects.archived, false),
    orderBy: [desc(projects.createdAt)],
    with: {
      area: true,
      timeEntries: true,
    },
  })

  // Filter to only include projects from areas that belong to this user
  return result.filter((project) => project.area.userId === session.user.id)
}

export async function getProjectById(id: number) {
  const session = await getSession()
  if (!session?.user) return null

  const result = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      area: true,
      timeEntries: {
        orderBy: [desc(timeEntries.startTime)],
      },
    },
  })

  // Verify this project belongs to the user
  if (!result || result.area.userId !== session.user.id) {
    return null
  }

  return result
}

export async function getProjectsWithStats() {
  const session = await getSession()
  if (!session?.user) return []

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const projectsData = await db.query.projects.findMany({
    where: eq(projects.archived, false),
    orderBy: [desc(projects.createdAt)],
    with: {
      area: true,
      timeEntries: true,
    },
  })

  // Filter to only include projects from areas that belong to this user
  const userProjects = projectsData.filter(
    (project) => project.area.userId === session.user.id,
  )

  return userProjects.map((project) => {
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
