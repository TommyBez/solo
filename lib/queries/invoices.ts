import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { invoices, timeEntries } from '@/lib/db/schema'

export async function getInvoices(clientId?: number) {
  const session = await getSession()
  if (!session?.user) return []

  const result = await db.query.invoices.findMany({
    where: clientId ? eq(invoices.clientId, clientId) : undefined,
    orderBy: [desc(invoices.issueDate)],
    with: {
      client: true,
      lineItems: true,
    },
  })

  // Filter to only include invoices from clients that belong to this user
  return result.filter((invoice) => invoice.client.userId === session.user.id)
}

export async function getInvoice(id: number) {
  const session = await getSession()
  if (!session?.user) return null

  const result = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
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

  // Verify this invoice belongs to the user
  if (!result || result.client.userId !== session.user.id) {
    return null
  }

  return result
}

export async function getUnbilledTimeEntries(
  clientId: number,
  startDate?: Date,
  endDate?: Date,
) {
  const session = await getSession()
  if (!session?.user) return []

  // Get all time entries for projects in areas linked to this client
  // that are not yet invoiced and are billable
  const result = await db.query.timeEntries.findMany({
    where: and(
      eq(timeEntries.billable, true),
      isNull(timeEntries.invoiceId),
      startDate ? gte(timeEntries.startTime, startDate) : undefined,
      endDate ? lte(timeEntries.startTime, endDate) : undefined,
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

  // Filter to only entries for this client and verify user ownership
  return result.filter(
    (entry) =>
      entry.project.area.clientId === clientId &&
      entry.project.area.userId === session.user.id,
  )
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
  if (!session?.user) return {}

  // Get all unbilled time entries grouped by client
  const result = await db.query.timeEntries.findMany({
    where: and(eq(timeEntries.billable, true), isNull(timeEntries.invoiceId)),
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

  // Filter to only include entries for this user and group by client ID
  const entriesByClient: Record<number, typeof result> = {}

  for (const entry of result) {
    // Verify this entry belongs to the user
    if (entry.project.area.userId !== session.user.id) continue

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

  const allInvoices = await db.query.invoices.findMany({
    with: {
      client: true,
    },
  })

  // Filter to only include invoices from clients that belong to this user
  const userInvoices = allInvoices.filter(
    (invoice) => invoice.client.userId === session.user.id,
  )

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
