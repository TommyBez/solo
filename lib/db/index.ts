import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http'
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres'
import pg from 'pg'
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
  projects,
  projectsRelations,
  timeEntries,
  timeEntriesRelations,
} from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const schema = {
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
  timeEntries,
  timeEntriesRelations,
}

function createDb() {
  if (process.env.USE_LOCAL_DB === 'true') {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    return drizzleNodePg(pool, { schema })
  }
  const sql = neon(process.env.DATABASE_URL!)
  return drizzleNeonHttp(sql, { schema })
}

export const db = createDb()
