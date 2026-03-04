/**
 * One-time migration script: create personal organizations for all existing users
 * and backfill organizationId on areas and clients.
 *
 * Run with: npx tsx scripts/migrate-to-orgs.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import {
  user,
  organization,
  member,
} from '../lib/auth/schema'
import {
  areas,
  clients,
  userSettings,
  organizationSettings,
} from '../lib/db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

async function migrate() {
  console.log('Starting organization migration...')

  const allUsers = await db.select().from(user)
  console.log(`Found ${allUsers.length} users to migrate`)

  for (const u of allUsers) {
    // Check if user already has an org (idempotent)
    const existingMember = await db
      .select()
      .from(member)
      .where(eq(member.userId, u.id))
      .then((rows) => rows[0])

    if (existingMember) {
      console.log(`User "${u.name}" already has an org, skipping creation`)

      // Still backfill organizationId on areas/clients if missing
      await db
        .update(areas)
        .set({ organizationId: existingMember.organizationId })
        .where(eq(areas.userId, u.id))
      await db
        .update(clients)
        .set({ organizationId: existingMember.organizationId })
        .where(eq(clients.userId, u.id))
      continue
    }

    const orgId = crypto.randomUUID()
    const slug =
      u.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') || u.id

    // Create organization
    await db.insert(organization).values({
      id: orgId,
      name: `${u.name}'s Workspace`,
      slug: `${slug}-${orgId.slice(0, 6)}`,
    })

    // Create owner membership
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: u.id,
      role: 'owner',
    })

    // Backfill areas
    const updatedAreas = await db
      .update(areas)
      .set({ organizationId: orgId })
      .where(eq(areas.userId, u.id))
      .returning()
    console.log(`  Updated ${updatedAreas.length} areas`)

    // Backfill clients
    const updatedClients = await db
      .update(clients)
      .set({ organizationId: orgId })
      .where(eq(clients.userId, u.id))
      .returning()
    console.log(`  Updated ${updatedClients.length} clients`)

    // Migrate company settings to org settings
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, u.id))
      .then((rows) => rows[0])

    if (
      settings &&
      (settings.companyName ||
        settings.companyEmail ||
        settings.companyPhone ||
        settings.companyAddress)
    ) {
      await db.insert(organizationSettings).values({
        organizationId: orgId,
        companyName: settings.companyName,
        companyEmail: settings.companyEmail,
        companyPhone: settings.companyPhone,
        companyAddress: settings.companyAddress,
      })
      console.log(`  Migrated company settings`)
    }

    console.log(`Migrated user "${u.name}" → org "${orgId}"`)
  }

  console.log(`\nMigration complete! ${allUsers.length} users processed.`)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
