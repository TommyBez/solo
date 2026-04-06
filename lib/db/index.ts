import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http'
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import {
  account,
  accountRelations,
  invitation,
  invitationRelations,
  member,
  memberRelations,
  organization,
  organizationRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from '@/lib/auth/schema'
import {
  aiSuggestionDismissals,
  aiSuggestionDismissalsRelations,
  areas,
  areasRelations,
  clients,
  clientsRelations,
  organizationSettings,
  organizationSettingsRelations,
  outOfOfficeDays,
  outOfOfficeDaysRelations,
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
  // Organization schema
  organization,
  organizationRelations,
  member,
  memberRelations,
  invitation,
  invitationRelations,
  // App schema
  clients,
  clientsRelations,
  areas,
  areasRelations,
  projects,
  projectsRelations,
  timeEntries,
  timeEntriesRelations,
  outOfOfficeDays,
  outOfOfficeDaysRelations,
  organizationSettings,
  organizationSettingsRelations,
  aiSuggestionDismissals,
  aiSuggestionDismissalsRelations,
}

function createDb() {
  const databaseUrl = process.env.DATABASE_URL as string
  if (process.env.USE_LOCAL_DB === 'true') {
    const pool = new pg.Pool({ connectionString: databaseUrl })
    return drizzleNodePg(pool, { schema })
  }
  const sql = neon(databaseUrl)
  return drizzleNeonHttp(sql, { schema })
}

export const db = createDb()
