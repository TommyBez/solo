'use server'

import { and, eq, gte, inArray, lte } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { requireRole } from '@/lib/auth/permissions'
import { requireOrganization } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas, outOfOfficeDays, projects, timeEntries } from '@/lib/db/schema'
import {
  getUtcDateKey,
  getUtcDayBoundsFromDateKey,
  isDateKey,
} from '@/lib/out-of-office'

/** Resolves to a stable yyyy-MM-dd key: ISO date strings pass through; other inputs use UTC calendar day. */
function normalizeDateKey(value: Date | string) {
  if (value instanceof Date) {
    return getUtcDateKey(value)
  }

  if (isDateKey(value)) {
    return value
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date')
  }

  return getUtcDateKey(parsedDate)
}

async function getOrgProjectIdsForUser(organizationId: string, userId: string) {
  const orgProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(areas, eq(projects.areaId, areas.id))
    .where(
      and(eq(areas.organizationId, organizationId), eq(areas.userId, userId)),
    )

  return orgProjects.map((project) => project.id)
}

async function hasTrackedTimeOnDate(
  dateKey: string,
  organizationId: string,
  userId: string,
) {
  const orgProjectIds = await getOrgProjectIdsForUser(organizationId, userId)

  if (orgProjectIds.length === 0) {
    return false
  }

  const { start: utcDayStart, end: utcDayEnd } =
    getUtcDayBoundsFromDateKey(dateKey)
  const entry = await db.query.timeEntries.findFirst({
    where: and(
      inArray(timeEntries.projectId, orgProjectIds),
      gte(timeEntries.startTime, utcDayStart),
      lte(timeEntries.startTime, utcDayEnd),
    ),
    columns: { id: true },
  })

  return Boolean(entry)
}

export async function markOutOfOfficeDay(dateValue: Date | string) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  const dateKey = normalizeDateKey(dateValue)
  const existingDay = await db.query.outOfOfficeDays.findFirst({
    where: and(
      eq(outOfOfficeDays.organizationId, organizationId),
      eq(outOfOfficeDays.userId, session.user.id),
      eq(outOfOfficeDays.dateKey, dateKey),
    ),
  })

  if (existingDay) {
    return existingDay
  }

  if (await hasTrackedTimeOnDate(dateKey, organizationId, session.user.id)) {
    throw new Error(
      'This day already has tracked time. Remove those entries before marking it out of office.',
    )
  }

  const [createdDay] = await db
    .insert(outOfOfficeDays)
    .values({
      userId: session.user.id,
      organizationId,
      dateKey,
    })
    .returning()

  revalidateTag('out-of-office-days', 'max')
  revalidateTag('time-entries', 'max')

  return createdDay
}

export async function removeOutOfOfficeDay(dateValue: Date | string) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  const dateKey = normalizeDateKey(dateValue)

  const [removedDay] = await db
    .delete(outOfOfficeDays)
    .where(
      and(
        eq(outOfOfficeDays.organizationId, organizationId),
        eq(outOfOfficeDays.userId, session.user.id),
        eq(outOfOfficeDays.dateKey, dateKey),
      ),
    )
    .returning()

  revalidateTag('out-of-office-days', 'max')
  revalidateTag('time-entries', 'max')

  return removedDay ?? null
}
