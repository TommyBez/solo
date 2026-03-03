import { and, desc, eq } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { clients } from '@/lib/db/schema'

async function getClientsCached(userId: string, includeArchived: boolean) {
  'use cache'
  cacheLife('minutes')
  cacheTag('clients', 'projects')
  return await db.query.clients.findMany({
    where: includeArchived
      ? eq(clients.userId, userId)
      : and(eq(clients.userId, userId), eq(clients.archived, false)),
    orderBy: [desc(clients.createdAt)],
    with: {
      projects: {
        where: (projectsTable, { eq: eqFn }) => eqFn(projectsTable.archived, false),
      },
    },
  })
}

export async function getClients(includeArchived = false) {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  return getClientsCached(session.user.id, includeArchived)
}
