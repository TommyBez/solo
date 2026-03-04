'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { requireRole } from '@/lib/auth/permissions'
import { requireOrganization } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { clients, type NewClient } from '@/lib/db/schema'

export async function createClient(
  data: Omit<
    NewClient,
    'id' | 'userId' | 'organizationId' | 'createdAt' | 'updatedAt'
  >,
) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  const [client] = await db
    .insert(clients)
    .values({
      ...data,
      userId: session.user.id,
      organizationId,
      updatedAt: new Date(),
    })
    .returning()

  revalidateTag('clients', 'max')
  revalidateTag('projects', 'max')
  return client
}

export async function updateClient(
  id: number,
  data: Partial<
    Omit<NewClient, 'id' | 'userId' | 'organizationId' | 'createdAt'>
  >,
) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  const [client] = await db
    .update(clients)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)))
    .returning()

  revalidateTag('clients', 'max')
  revalidateTag('projects', 'max')
  return client
}

export async function deleteClient(id: number) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)))
  revalidateTag('clients', 'max')
  revalidateTag('projects', 'max')
}

export async function archiveClient(id: number) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  const [client] = await db
    .update(clients)
    .set({
      archived: true,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)))
    .returning()

  revalidateTag('clients', 'max')
  return client
}
