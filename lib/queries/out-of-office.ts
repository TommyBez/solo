import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { getActiveOrganizationId, getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { outOfOfficeDays } from '@/lib/db/schema'
import { getDateKey } from '@/lib/out-of-office'

async function getOutOfOfficeDaysForDateRangeCached(
  organizationId: string,
  userId: string,
  startDateKey: string,
  endDateKey: string,
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('out-of-office-days')

  return db.query.outOfOfficeDays.findMany({
    where: and(
      eq(outOfOfficeDays.organizationId, organizationId),
      eq(outOfOfficeDays.userId, userId),
      gte(outOfOfficeDays.dateKey, startDateKey),
      lte(outOfOfficeDays.dateKey, endDateKey),
    ),
    orderBy: [asc(outOfOfficeDays.dateKey)],
  })
}

export async function getOutOfOfficeDaysForDateRangeByUser(
  organizationId: string,
  userId: string,
  startDate: Date,
  endDate: Date,
) {
  return getOutOfOfficeDaysForDateRangeCached(
    organizationId,
    userId,
    getDateKey(startDate),
    getDateKey(endDate),
  )
}

export async function getOutOfOfficeDateKeysForDateRangeByUser(
  organizationId: string,
  userId: string,
  startDate: Date,
  endDate: Date,
) {
  const days = await getOutOfOfficeDaysForDateRangeByUser(
    organizationId,
    userId,
    startDate,
    endDate,
  )

  return days.map((day) => day.dateKey)
}

export async function getOutOfOfficeDaysForDateRange(
  startDate: Date,
  endDate: Date,
) {
  const [organizationId, session] = await Promise.all([
    getActiveOrganizationId(),
    getSession(),
  ])

  if (!organizationId || !session?.user) {
    return []
  }

  return getOutOfOfficeDaysForDateRangeByUser(
    organizationId,
    session.user.id,
    startDate,
    endDate,
  )
}

export async function getOutOfOfficeDateKeysForDateRange(
  startDate: Date,
  endDate: Date,
) {
  const days = await getOutOfOfficeDaysForDateRange(startDate, endDate)
  return days.map((day) => day.dateKey)
}
