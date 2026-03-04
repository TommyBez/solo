import { and, desc, eq } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { getActiveOrganizationId } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { clients } from '@/lib/db/schema'

async function getClientsCached(
  organizationId: string,
  includeArchived: boolean,
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('clients', 'projects')
  return await db.query.clients.findMany({
    where: includeArchived
      ? eq(clients.organizationId, organizationId)
      : and(
          eq(clients.organizationId, organizationId),
          eq(clients.archived, false),
        ),
    orderBy: [desc(clients.createdAt)],
    with: {
      projects: {
        where: (projectsTable, { eq: eqFn }) =>
          eqFn(projectsTable.archived, false),
      },
    },
  })
}

export async function getClients(includeArchived = false) {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    return []
  }

  return getClientsCached(orgId, includeArchived)
}
