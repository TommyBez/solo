'use server'

import { eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { timeEntries } from '@/lib/db/schema'

export async function createTimeEntry(data: {
  projectId: number
  description?: string
  startTime: Date
  endTime?: Date
  durationMinutes: number
}) {
  const result = await db.insert(timeEntries).values(data).returning()
  revalidateTag('time-entries', 'max')
  return result[0]
}

export async function updateTimeEntry(
  id: number,
  data: {
    description?: string
    startTime?: Date
    endTime?: Date
    durationMinutes?: number
  },
) {
  const result = await db
    .update(timeEntries)
    .set(data)
    .where(eq(timeEntries.id, id))
    .returning()
  revalidateTag('time-entries', 'max')
  return result[0]
}

export async function deleteTimeEntry(id: number) {
  await db.delete(timeEntries).where(eq(timeEntries.id, id))
  revalidateTag('time-entries', 'max')
}
