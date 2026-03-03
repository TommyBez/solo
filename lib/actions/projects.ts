'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas, projects } from '@/lib/db/schema'

async function verifyAreaOwnership(areaId: number, userId: string) {
  const area = await db.query.areas.findFirst({
    where: and(eq(areas.id, areaId), eq(areas.userId, userId)),
  })
  return !!area
}

async function verifyProjectOwnership(projectId: number, userId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { area: true },
  })
  return project?.area.userId === userId
}

export async function createProject(data: {
  areaId: number
  clientId?: number
  name: string
  description?: string
  status?: string
  expectedHours?: number
  recurring?: boolean
  deadline?: Date
}) {
  const session = await requireSession()

  // Verify user owns the area
  const ownsArea = await verifyAreaOwnership(data.areaId, session.user.id)
  if (!ownsArea) {
    throw new Error('Unauthorized')
  }

  const result = await db.insert(projects).values(data).returning()
  revalidateTag('projects', 'max')
  return result[0]
}

export async function updateProject(
  id: number,
  data: {
    name?: string
    description?: string
    status?: string
    expectedHours?: number
    recurring?: boolean
    clientId?: number | null
    deadline?: Date | null
    archived?: boolean
  },
) {
  const session = await requireSession()

  // Verify user owns the project (through area)
  const ownsProject = await verifyProjectOwnership(id, session.user.id)
  if (!ownsProject) {
    throw new Error('Unauthorized')
  }

  const result = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning()
  revalidateTag('projects', 'max')
  return result[0]
}

export async function deleteProject(id: number) {
  const session = await requireSession()

  // Verify user owns the project (through area)
  const ownsProject = await verifyProjectOwnership(id, session.user.id)
  if (!ownsProject) {
    throw new Error('Unauthorized')
  }

  await db.delete(projects).where(eq(projects.id, id))
  revalidateTag('projects', 'max')
}
