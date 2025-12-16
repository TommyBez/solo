'use server'

import { desc, eq, gte } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { areas, projects, timeEntries } from '@/lib/db/schema'

export async function getAreas(includeArchived = false) {
  const conditions = includeArchived ? undefined : eq(areas.archived, false)

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
  return db.query.areas.findFirst({
    where: eq(areas.id, id),
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

export async function createArea(data: {
  name: string
  description?: string
  color: string
  expectedHoursPerWeek: number
}) {
  const result = await db.insert(areas).values(data).returning()
  revalidateTag('areas', 'max')
  return result[0]
}

export async function updateArea(
  id: number,
  data: {
    name?: string
    description?: string
    color?: string
    expectedHoursPerWeek?: number
    archived?: boolean
  },
) {
  const result = await db
    .update(areas)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(areas.id, id))
    .returning()
  revalidateTag('areas', 'max')
  return result[0]
}

export async function deleteArea(id: number) {
  await db.delete(areas).where(eq(areas.id, id))
  revalidateTag('areas', 'max')
}

export async function getAreasWithStats() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const areasData = await db.query.areas.findMany({
    where: eq(areas.archived, false),
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
