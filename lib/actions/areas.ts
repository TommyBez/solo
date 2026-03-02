'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas } from '@/lib/db/schema'

export async function createArea(data: {
  name: string
  description?: string
  color: string
  expectedHoursPerWeek: number
  clientId?: number
}) {
  const session = await requireSession()

  const result = await db
    .insert(areas)
    .values({
      ...data,
      userId: session.user.id,
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
    clientId?: number | null
    archived?: boolean
  },
) {
  const session = await requireSession()

  const result = await db
    .update(areas)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(areas.id, id), eq(areas.userId, session.user.id)))
    .returning()
  revalidateTag('areas', 'max')
  return result[0]
}

export async function deleteArea(id: number) {
  const session = await requireSession()

  await db
    .delete(areas)
    .where(and(eq(areas.id, id), eq(areas.userId, session.user.id)))
  revalidateTag('areas', 'max')
}
