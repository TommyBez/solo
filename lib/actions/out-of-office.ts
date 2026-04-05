'use server'

import { endOfDay, parseISO, startOfDay } from 'date-fns'
import { and, eq, gte, inArray, lte } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { requireRole } from '@/lib/auth/permissions'
import { requireOrganization } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { areas, outOfOfficeDays, projects, timeEntries } from '@/lib/db/schema'
import { getDateKey, isDateKey } from '@/lib/out-of-office'

function normalizeDateKey(value: Date | string) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Invalid date')
    }

    return getDateKey(value)
  }

  if (isDateKey(value)) {
    return value
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date')
  }

  return getDateKey(parsedDate)
}

async function getOrgProjectIds(organizationId: string) {
  const orgProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(areas, eq(projects.areaId, areas.id))
    .where(eq(areas.organizationId, organizationId))

  return orgProjects.map((project) => project.id)
}

async function hasTrackedTimeOnDate(dateKey: string, organizationId: string) {
  const orgProjectIds = await getOrgProjectIds(organizationId)

  if (orgProjectIds.length === 0) {
    return false
  }

  const date = parseISO(dateKey)
  const entry = await db.query.timeEntries.findFirst({
    where: and(
      inArray(timeEntries.projectId, orgProjectIds),
      gte(timeEntries.startTime, startOfDay(date)),
      lte(timeEntries.startTime, endOfDay(date)),
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

  if (await hasTrackedTimeOnDate(dateKey, organizationId)) {
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
