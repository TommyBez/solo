import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import {
  areas,
  areasRelations,
  clients,
  clientsRelations,
  invoiceLineItems,
  invoiceLineItemsRelations,
  invoices,
  invoicesRelations,
  projects,
  projectsRelations,
  timeEntries,
  timeEntriesRelations,
} from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

export const db = drizzle(sql, {
  schema: {
    clients,
    clientsRelations,
    areas,
    areasRelations,
    projects,
    projectsRelations,
    invoices,
    invoicesRelations,
    invoiceLineItems,
    invoiceLineItemsRelations,
    timeEntries,
    timeEntriesRelations,
  },
})
