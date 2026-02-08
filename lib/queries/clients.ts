import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { clients } from '@/lib/db/schema'

export async function getClients(includeArchived = false) {
  const result = await db.query.clients.findMany({
    where: includeArchived ? undefined : eq(clients.archived, false),
    orderBy: [desc(clients.createdAt)],
    with: {
      areas: {
        where: (areasTable, { eq: eqFn }) => eqFn(areasTable.archived, false),
      },
    },
  })

  return result
}

export async function getClient(id: number) {
  const result = await db.query.clients.findFirst({
    where: eq(clients.id, id),
    with: {
      areas: {
        with: {
          projects: true,
        },
      },
    },
  })

  return result
}

export async function getClientsForSelect() {
  const result = await db.query.clients.findMany({
    where: eq(clients.archived, false),
    orderBy: [desc(clients.name)],
    columns: {
      id: true,
      name: true,
      hourlyRate: true,
      currency: true,
    },
  })

  return result
}
