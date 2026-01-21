'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { clients, type NewClient } from '@/lib/db/schema'

export async function createClient(
  data: Omit<NewClient, 'id' | 'createdAt' | 'updatedAt'>,
) {
  const [client] = await db
    .insert(clients)
    .values({
      ...data,
      updatedAt: new Date(),
    })
    .returning()

  revalidatePath('/clients')
  revalidatePath('/areas')
  return client
}

export async function updateClient(
  id: number,
  data: Partial<Omit<NewClient, 'id' | 'createdAt'>>,
) {
  const [client] = await db
    .update(clients)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id))
    .returning()

  revalidatePath('/clients')
  revalidatePath('/areas')
  return client
}

export async function deleteClient(id: number) {
  await db.delete(clients).where(eq(clients.id, id))
  revalidatePath('/clients')
  revalidatePath('/areas')
}

export async function archiveClient(id: number) {
  const [client] = await db
    .update(clients)
    .set({
      archived: true,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id))
    .returning()

  revalidatePath('/clients')
  return client
}

export async function unarchiveClient(id: number) {
  const [client] = await db
    .update(clients)
    .set({
      archived: false,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id))
    .returning()

  revalidatePath('/clients')
  return client
}
