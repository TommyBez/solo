'use server'

import { eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'

export async function createProject(data: {
  areaId: number
  name: string
  description?: string
  status?: string
  expectedHours?: number
  deadline?: Date
}) {
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
    deadline?: Date | null
    archived?: boolean
  },
) {
  const result = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning()
  revalidateTag('projects', 'max')
  return result[0]
}

export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id))
  revalidateTag('projects', 'max')
}
