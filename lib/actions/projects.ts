'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { requireRole } from '@/lib/auth/permissions'
import { requireOrganization } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas, projects } from '@/lib/db/schema'

async function verifyAreaInOrg(areaId: number, organizationId: string) {
  const area = await db.query.areas.findFirst({
    where: and(
      eq(areas.id, areaId),
      eq(areas.organizationId, organizationId),
    ),
  })
  return !!area
}

async function verifyProjectInOrg(
  projectId: number,
  organizationId: string,
) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { area: true },
  })
  return project?.area.organizationId === organizationId
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
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  // Verify area belongs to this org
  const areaInOrg = await verifyAreaInOrg(data.areaId, organizationId)
  if (!areaInOrg) {
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
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  // Verify project belongs to this org (through area)
  const projectInOrg = await verifyProjectInOrg(id, organizationId)
  if (!projectInOrg) {
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
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  // Verify project belongs to this org (through area)
  const projectInOrg = await verifyProjectInOrg(id, organizationId)
  if (!projectInOrg) {
    throw new Error('Unauthorized')
  }

  await db.delete(projects).where(eq(projects.id, id))
  revalidateTag('projects', 'max')
}
