'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { requireRole } from '@/lib/auth/permissions'
import { requireOrganization } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas } from '@/lib/db/schema'

export async function createArea(data: {
  name: string
  description?: string
  color: string
  expectedHoursPerWeek: number
}) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  const result = await db
    .insert(areas)
    .values({
      ...data,
      userId: session.user.id,
      organizationId,
    })
    .returning()
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
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  const result = await db
    .update(areas)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(areas.id, id), eq(areas.organizationId, organizationId)),
    )
    .returning()
  revalidateTag('areas', 'max')
  return result[0]
}

export async function deleteArea(id: number) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  await db
    .delete(areas)
    .where(
      and(eq(areas.id, id), eq(areas.organizationId, organizationId)),
    )
  revalidateTag('areas', 'max')
}
