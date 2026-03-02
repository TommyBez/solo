import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from '@/lib/auth/schema'
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
    // Auth schema
    user,
    userRelations,
    session,
    sessionRelations,
    account,
    accountRelations,
    verification,
    // App schema
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
