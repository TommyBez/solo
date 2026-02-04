'use server'

import { eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { projects, timeEntries } from '@/lib/db/schema'

async function verifyProjectOwnership(projectId: number, userId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { area: true },
  })
  return project?.area.userId === userId
}

async function verifyTimeEntryOwnership(timeEntryId: number, userId: string) {
  const entry = await db.query.timeEntries.findFirst({
    where: eq(timeEntries.id, timeEntryId),
    with: {
      project: {
        with: { area: true },
      },
    },
  })
  return entry?.project.area.userId === userId
}

export async function createTimeEntry(data: {
  projectId: number
  description?: string
  startTime: Date
  endTime?: Date
  durationMinutes: number
}) {
  const session = await requireSession()

  // Verify user owns the project (through area)
  const ownsProject = await verifyProjectOwnership(data.projectId, session.user.id)
  if (!ownsProject) {
    throw new Error('Unauthorized')
  }

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
  const session = await requireSession()

  // Verify user owns the time entry (through project/area chain)
  const ownsEntry = await verifyTimeEntryOwnership(id, session.user.id)
  if (!ownsEntry) {
    throw new Error('Unauthorized')
  }

  const result = await db
    .update(timeEntries)
    .set(data)
    .where(eq(timeEntries.id, id))
    .returning()
  revalidateTag('time-entries', 'max')
  return result[0]
}

export async function deleteTimeEntry(id: number) {
  const session = await requireSession()

  // Verify user owns the time entry (through project/area chain)
  const ownsEntry = await verifyTimeEntryOwnership(id, session.user.id)
  if (!ownsEntry) {
    throw new Error('Unauthorized')
  }

  await db.delete(timeEntries).where(eq(timeEntries.id, id))
  revalidateTag('time-entries', 'max')
}
