'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { clients, type NewClient } from '@/lib/db/schema'

export async function createClient(
  data: Omit<NewClient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
) {
  const session = await requireSession()

  const [client] = await db
    .insert(clients)
    .values({
      ...data,
      userId: session.user.id,
      updatedAt: new Date(),
    })
    .returning()

  revalidatePath('/clients')
  revalidatePath('/areas')
  return client
}

export async function updateClient(
  id: number,
  data: Partial<Omit<NewClient, 'id' | 'userId' | 'createdAt'>>,
) {
  const session = await requireSession()

  const [client] = await db
    .update(clients)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)))
    .returning()

  revalidatePath('/clients')
  revalidatePath('/areas')
  return client
}

export async function deleteClient(id: number) {
  const session = await requireSession()

  await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)))
  revalidatePath('/clients')
  revalidatePath('/areas')
}

export async function archiveClient(id: number) {
  const session = await requireSession()

  const [client] = await db
    .update(clients)
    .set({
      archived: true,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)))
    .returning()

  revalidatePath('/clients')
  return client
}

export async function unarchiveClient(id: number) {
  const session = await requireSession()

  const [client] = await db
    .update(clients)
    .set({
      archived: false,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.userId, session.user.id)))
    .returning()

  revalidatePath('/clients')
  return client
}
