import { and, desc, eq, gte, inArray, isNull, lte } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import {
  areas,
  clients,
  invoices,
  projects,
  timeEntries,
} from '@/lib/db/schema'

// Helper to get user's client IDs for filtering
async function getUserClientIds(userId: string): Promise<number[]> {
  const userClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.userId, userId))
  return userClients.map((c) => c.id)
}

// Helper to get user's project IDs for filtering time entries
async function getUserProjectIds(userId: string): Promise<number[]> {
  const userProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(areas, eq(projects.areaId, areas.id))
    .where(eq(areas.userId, userId))
  return userProjects.map((p) => p.id)
}

export async function getInvoices(clientId?: number) {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  const userClientIds = await getUserClientIds(session.user.id)
  if (userClientIds.length === 0) {
    return []
  }

  const conditions = [inArray(invoices.clientId, userClientIds)]

  if (clientId) {
    conditions.push(eq(invoices.clientId, clientId))
  }

  return db.query.invoices.findMany({
    where: and(...conditions),
    orderBy: [desc(invoices.issueDate)],
    with: {
      client: true,
      lineItems: true,
    },
  })
}

export async function getInvoice(id: number) {
  const session = await getSession()
  if (!session?.user) {
    return null
  }

  const userClientIds = await getUserClientIds(session.user.id)
  if (userClientIds.length === 0) {
    return null
  }

  return db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), inArray(invoices.clientId, userClientIds)),
    with: {
      client: true,
      lineItems: {
        with: {
          timeEntry: {
            with: {
              project: {
                with: {
                  area: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

export async function getUnbilledTimeEntries(
  clientId: number,
  startDate?: Date,
  endDate?: Date,
) {
  const session = await getSession()
  if (!session?.user) {
    return []
  }

  // Verify user owns this client
  const userClientIds = await getUserClientIds(session.user.id)
  if (!userClientIds.includes(clientId)) {
    return []
  }

  // Get project IDs for areas linked to this client
  const clientProjectIds = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(areas, eq(projects.areaId, areas.id))
    .where(and(eq(areas.clientId, clientId), eq(areas.userId, session.user.id)))
    .then((rows) => rows.map((r) => r.id))

  if (clientProjectIds.length === 0) {
    return []
  }

  const conditions = [
    inArray(timeEntries.projectId, clientProjectIds),
    eq(timeEntries.billable, true),
    isNull(timeEntries.invoiceId),
  ]

  if (startDate) {
    conditions.push(gte(timeEntries.startTime, startDate))
  }
  if (endDate) {
    conditions.push(lte(timeEntries.startTime, endDate))
  }

  return db.query.timeEntries.findMany({
    where: and(...conditions),
    orderBy: [desc(timeEntries.startTime)],
    with: {
      project: {
        with: {
          area: {
            with: {
              client: true,
            },
          },
        },
      },
    },
  })
}

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  // Get the last invoice number for this year
  const lastInvoice = await db.query.invoices.findFirst({
    where: (invoicesTable, { like }) =>
      like(invoicesTable.invoiceNumber, `${prefix}%`),
    orderBy: [desc(invoices.invoiceNumber)],
    columns: {
      invoiceNumber: true,
    },
  })

  let nextNumber = 1
  if (lastInvoice) {
    const lastNumber = Number.parseInt(
      lastInvoice.invoiceNumber.replace(prefix, ''),
      10,
    )
    if (!Number.isNaN(lastNumber)) {
      nextNumber = lastNumber + 1
    }
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

export async function getAllUnbilledTimeEntries() {
  const session = await getSession()
  if (!session?.user) {
    return {}
  }

  const userProjectIds = await getUserProjectIds(session.user.id)
  if (userProjectIds.length === 0) {
    return {}
  }

  // Get all unbilled time entries for user's projects
  const result = await db.query.timeEntries.findMany({
    where: and(
      inArray(timeEntries.projectId, userProjectIds),
      eq(timeEntries.billable, true),
      isNull(timeEntries.invoiceId),
    ),
    orderBy: [desc(timeEntries.startTime)],
    with: {
      project: {
        with: {
          area: {
            with: {
              client: true,
            },
          },
        },
      },
    },
  })

  // Group entries by client ID
  const entriesByClient: Record<number, typeof result> = {}

  for (const entry of result) {
    const clientId = entry.project.area.clientId
    if (clientId) {
      if (!entriesByClient[clientId]) {
        entriesByClient[clientId] = []
      }
      entriesByClient[clientId].push(entry)
    }
  }

  return entriesByClient
}

export async function getInvoiceStats() {
  const session = await getSession()
  if (!session?.user) {
    return {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      totalOutstanding: 0,
      totalPaid: 0,
    }
  }

  const userClientIds = await getUserClientIds(session.user.id)
  if (userClientIds.length === 0) {
    return {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      totalOutstanding: 0,
      totalPaid: 0,
    }
  }

  const userInvoices = await db.query.invoices.findMany({
    where: inArray(invoices.clientId, userClientIds),
    columns: {
      status: true,
      total: true,
    },
  })

  const stats = {
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    totalOutstanding: 0,
    totalPaid: 0,
  }

  for (const invoice of userInvoices) {
    const amount = Number(invoice.total) || 0
    switch (invoice.status) {
      case 'draft':
        stats.draft += 1
        break
      case 'sent':
        stats.sent += 1
        stats.totalOutstanding += amount
        break
      case 'paid':
        stats.paid += 1
        stats.totalPaid += amount
        break
      case 'overdue':
        stats.overdue += 1
        stats.totalOutstanding += amount
        break
      default:
        break
    }
  }

  return stats
}
