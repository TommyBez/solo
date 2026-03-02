import { and, desc, eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { clients } from '@/lib/db/schema'

export async function getClients(includeArchived = false) {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  const result = await db.query.clients.findMany({
    where: includeArchived
      ? eq(clients.userId, session.user.id)
      : and(eq(clients.userId, session.user.id), eq(clients.archived, false)),
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
  const session = await getSession()
  if (!session?.user) {
    return null
  }

  const result = await db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.userId, session.user.id)),
    with: {
      areas: {
        with: {
          projects: true,
        },
      },
      invoices: {
        orderBy: (invoicesTable, { desc: descFn }) => [
          descFn(invoicesTable.issueDate),
        ],
      },
    },
  })

  return result
}

export async function getClientsForSelect() {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  const result = await db.query.clients.findMany({
    where: and(
      eq(clients.userId, session.user.id),
      eq(clients.archived, false),
    ),
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
