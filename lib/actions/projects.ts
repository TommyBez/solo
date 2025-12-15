"use server"

import { db } from "@/lib/db"
import { projects, timeEntries } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidateTag } from "next/cache"

export async function getProjects(areaId?: number, includeArchived = false) {
  const result = await db.query.projects.findMany({
    where: areaId
      ? includeArchived
        ? eq(projects.areaId, areaId)
        : eq(projects.areaId, areaId) && eq(projects.archived, false)
      : includeArchived
        ? undefined
        : eq(projects.archived, false),
    orderBy: [desc(projects.createdAt)],
    with: {
      area: true,
      timeEntries: true,
    },
  })

  return result
}

export async function getProjectById(id: number) {
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      area: true,
      timeEntries: {
        orderBy: [desc(timeEntries.startTime)],
      },
    },
  })
}

export async function createProject(data: {
  areaId: number
  name: string
  description?: string
  status?: string
  expectedHours?: number
  deadline?: Date
}) {
  const result = await db.insert(projects).values(data).returning()
  revalidateTag("projects", "max")
  return result[0]
}

export async function updateProject(
  id: number,
  data: {
    name?: string
    description?: string
    status?: string
    expectedHours?: number
    deadline?: Date | null
    archived?: boolean
  },
) {
  const result = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning()
  revalidateTag("projects", "max")
  return result[0]
}

export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id))
  revalidateTag("projects", "max")
}

export async function getProjectsWithStats() {
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

  return projectsData.map((project) => {
    const totalMinutes = project.timeEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0)
    const weekMinutes = project.timeEntries
      .filter((entry) => entry.startTime >= weekAgo)
      .reduce((sum, entry) => sum + entry.durationMinutes, 0)

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10
    const hoursThisWeek = Math.round((weekMinutes / 60) * 10) / 10
    const expectedHours = project.expectedHours
    const percentageComplete = expectedHours > 0 ? Math.round((totalHours / expectedHours) * 100) : 0

    return {
      ...project,
      totalHours,
      hoursThisWeek,
      percentageComplete,
    }
  })
}
