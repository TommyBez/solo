'use server'

import { and, eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import {
  clients,
  invoiceLineItems,
  invoices,
  type NewInvoice,
  type NewInvoiceLineItem,
  timeEntries,
} from '@/lib/db/schema'

async function verifyClientOwnership(clientId: number, userId: string) {
  const client = await db.query.clients.findFirst({
    where: and(eq(clients.id, clientId), eq(clients.userId, userId)),
  })
  return !!client
}

async function verifyInvoiceOwnership(invoiceId: number, userId: string) {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: { client: true },
  })
  return invoice?.client.userId === userId
}

export async function createInvoice(
  data: Omit<NewInvoice, 'id' | 'createdAt' | 'updatedAt'>,
  lineItems: Omit<NewInvoiceLineItem, 'id' | 'invoiceId' | 'createdAt'>[],
) {
  const session = await requireSession()

  // Verify user owns the client
  const ownsClient = await verifyClientOwnership(data.clientId, session.user.id)
  if (!ownsClient) {
    throw new Error('Unauthorized')
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount), 0)
  const taxAmount = subtotal * (Number(data.taxRate) / 100)
  const total = subtotal + taxAmount

  // Create invoice
  const [invoice] = await db
    .insert(invoices)
    .values({
      ...data,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      updatedAt: new Date(),
    })
    .returning()

  // Create line items
  if (lineItems.length > 0) {
    await db.insert(invoiceLineItems).values(
      lineItems.map((item) => ({
        ...item,
        invoiceId: invoice.id,
      })),
    )

    // Mark time entries as invoiced
    const timeEntryIds = lineItems
      .filter(
        (item): item is typeof item & { timeEntryId: number } =>
          item.timeEntryId !== null && item.timeEntryId !== undefined,
      )
      .map((item) => item.timeEntryId)

    if (timeEntryIds.length > 0) {
      for (const entryId of timeEntryIds) {
        await db
          .update(timeEntries)
          .set({ invoiceId: invoice.id })
          .where(eq(timeEntries.id, entryId))
      }
    }
  }

  revalidateTag('invoices', 'max')
  revalidateTag('time-entries', 'max')
  return invoice
}

export async function updateInvoice(
  id: number,
  data: Partial<Omit<NewInvoice, 'id' | 'createdAt'>>,
) {
  const session = await requireSession()

  // Verify user owns the invoice (through client)
  const ownsInvoice = await verifyInvoiceOwnership(id, session.user.id)
  if (!ownsInvoice) {
    throw new Error('Unauthorized')
  }

  const [invoice] = await db
    .update(invoices)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id))
    .returning()

  revalidateTag('invoices', 'max')
  return invoice
}

export async function updateInvoiceStatus(
  id: number,
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
) {
  const session = await requireSession()

  // Verify user owns the invoice (through client)
  const ownsInvoice = await verifyInvoiceOwnership(id, session.user.id)
  if (!ownsInvoice) {
    throw new Error('Unauthorized')
  }

  const [invoice] = await db
    .update(invoices)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id))
    .returning()

  revalidateTag('invoices', 'max')
  return invoice
}

export async function deleteInvoice(id: number) {
  const session = await requireSession()

  // Verify user owns the invoice (through client)
  const ownsInvoice = await verifyInvoiceOwnership(id, session.user.id)
  if (!ownsInvoice) {
    throw new Error('Unauthorized')
  }

  // First, unlink time entries
  await db
    .update(timeEntries)
    .set({ invoiceId: null })
    .where(eq(timeEntries.invoiceId, id))

  // Delete invoice (line items cascade)
  await db.delete(invoices).where(eq(invoices.id, id))

  revalidateTag('invoices', 'max')
  revalidateTag('time-entries', 'max')
}

export async function addLineItem(
  invoiceId: number,
  item: Omit<NewInvoiceLineItem, 'id' | 'invoiceId' | 'createdAt'>,
) {
  const session = await requireSession()

  // Verify user owns the invoice (through client)
  const ownsInvoice = await verifyInvoiceOwnership(invoiceId, session.user.id)
  if (!ownsInvoice) {
    throw new Error('Unauthorized')
  }

  const [lineItem] = await db
    .insert(invoiceLineItems)
    .values({
      ...item,
      invoiceId,
    })
    .returning()

  // Recalculate invoice totals
  await recalculateInvoiceTotals(invoiceId)

  // Mark time entry as invoiced if applicable
  if (item.timeEntryId) {
    await db
      .update(timeEntries)
      .set({ invoiceId })
      .where(eq(timeEntries.id, item.timeEntryId))
  }

  revalidateTag('invoices', 'max')
  revalidateTag('time-entries', 'max')
  return lineItem
}

export async function removeLineItem(lineItemId: number) {
  const session = await requireSession()

  // Get the line item first
  const lineItem = await db.query.invoiceLineItems.findFirst({
    where: eq(invoiceLineItems.id, lineItemId),
    with: {
      invoice: {
        with: { client: true },
      },
    },
  })

  if (!lineItem) {
    return
  }

  // Verify user owns the invoice (through client)
  if (lineItem.invoice.client.userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  // Unlink time entry if applicable
  if (lineItem.timeEntryId) {
    await db
      .update(timeEntries)
      .set({ invoiceId: null })
      .where(eq(timeEntries.id, lineItem.timeEntryId))
  }

  // Delete line item
  await db.delete(invoiceLineItems).where(eq(invoiceLineItems.id, lineItemId))

  // Recalculate invoice totals
  await recalculateInvoiceTotals(lineItem.invoiceId)

  revalidateTag('invoices', 'max')
  revalidateTag('time-entries', 'max')
}

async function recalculateInvoiceTotals(invoiceId: number) {
  const items = await db.query.invoiceLineItems.findMany({
    where: eq(invoiceLineItems.invoiceId, invoiceId),
  })

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    columns: { taxRate: true },
  })

  const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0)
  const taxRate = Number(invoice?.taxRate) || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  await db
    .update(invoices)
    .set({
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId))
}
