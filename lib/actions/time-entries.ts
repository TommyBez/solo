'use server'

import { addWeeks, endOfWeek, startOfWeek } from 'date-fns'
import { and, eq, gte, inArray, lte } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { requireRole } from '@/lib/auth/permissions'
import { requireOrganization } from '@/lib/auth/session'
import { db } from '@/lib/db'
import {
  areas,
  type NewTimeEntry,
  projects,
  timeEntries,
} from '@/lib/db/schema'
import { getSettings } from '@/lib/queries/settings'

async function verifyProjectInOrg(
  projectId: number,
  organizationId: string,
) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { area: true },
  })
  return project?.area.organizationId === organizationId
}

async function verifyTimeEntryInOrg(
  timeEntryId: number,
  organizationId: string,
) {
  const entry = await db.query.timeEntries.findFirst({
    where: eq(timeEntries.id, timeEntryId),
    with: {
      project: {
        with: { area: true },
      },
    },
  })
  return entry?.project.area.organizationId === organizationId
}

function buildTimeEntryDedupKey(entry: {
  billable: boolean
  description: string | null | undefined
  durationMinutes: number
  projectId: number
  startTime: Date
}) {
  return [
    entry.projectId,
    entry.startTime.toISOString(),
    entry.durationMinutes,
    entry.description?.trim().toLowerCase() ?? '',
    entry.billable ? '1' : '0',
  ].join('|')
}

export async function createTimeEntry(data: {
  projectId: number
  description?: string
  startTime: Date
  endTime?: Date
  durationMinutes: number
}) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  // Verify project belongs to this org (through area)
  const projectInOrg = await verifyProjectInOrg(
    data.projectId,
    organizationId,
  )
  if (!projectInOrg) {
    throw new Error('Unauthorized')
  }

  const result = await db.insert(timeEntries).values(data).returning()
  revalidateTag('time-entries', 'max')
  return result[0]
}

export async function updateTimeEntry(
  id: number,
  data: {
    projectId?: number
    description?: string
    startTime?: Date
    endTime?: Date
    durationMinutes?: number
  },
) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  // Verify time entry belongs to this org (through project/area chain)
  const entryInOrg = await verifyTimeEntryInOrg(id, organizationId)
  if (!entryInOrg) {
    throw new Error('Unauthorized')
  }

  const updateData = { ...data }
  if (updateData.projectId !== undefined) {
    const projectInOrg = await verifyProjectInOrg(
      updateData.projectId,
      organizationId,
    )
    if (!projectInOrg) {
      throw new Error('Unauthorized')
    }
  }

  const result = await db
    .update(timeEntries)
    .set(updateData)
    .where(eq(timeEntries.id, id))
    .returning()
  revalidateTag('time-entries', 'max')
  return result[0]
}

export async function deleteTimeEntry(id: number) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  // Verify time entry belongs to this org (through project/area chain)
  const entryInOrg = await verifyTimeEntryInOrg(id, organizationId)
  if (!entryInOrg) {
    throw new Error('Unauthorized')
  }

  await db.delete(timeEntries).where(eq(timeEntries.id, id))
  revalidateTag('time-entries', 'max')
}

export async function scheduleTasksForFollowingWeek(referenceDateIso: string) {
  const { session, organizationId } = await requireOrganization()
  await requireRole(session.user.id, organizationId, 'member')

  const referenceDate = new Date(referenceDateIso)

  if (Number.isNaN(referenceDate.getTime())) {
    throw new Error('Invalid reference date')
  }

  // Get user's week start preference
  const settings = await getSettings(session.user.id)
  const weekStartsOn = settings.weekStartsOn === '0' ? 0 : 1

  const sourceWeekStart = startOfWeek(referenceDate, {
    weekStartsOn,
  })
  const sourceWeekEnd = endOfWeek(referenceDate, {
    weekStartsOn,
  })
  const targetWeekStart = addWeeks(sourceWeekStart, 1)
  const targetWeekEnd = endOfWeek(targetWeekStart, {
    weekStartsOn,
  })

  const orgProjectRows = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(areas, eq(projects.areaId, areas.id))
    .where(eq(areas.organizationId, organizationId))

  const orgProjectIds = orgProjectRows.map((project) => project.id)
  if (orgProjectIds.length === 0) {
    return { createdCount: 0, skippedCount: 0, sourceCount: 0 }
  }

  const sourceEntries = await db.query.timeEntries.findMany({
    where: and(
      inArray(timeEntries.projectId, orgProjectIds),
      gte(timeEntries.startTime, sourceWeekStart),
      lte(timeEntries.startTime, sourceWeekEnd),
    ),
  })

  if (sourceEntries.length === 0) {
    return { createdCount: 0, skippedCount: 0, sourceCount: 0 }
  }

  const targetEntries = await db.query.timeEntries.findMany({
    where: and(
      inArray(timeEntries.projectId, orgProjectIds),
      gte(timeEntries.startTime, targetWeekStart),
      lte(timeEntries.startTime, targetWeekEnd),
    ),
  })

  const existingKeys = new Set(
    targetEntries.map((entry) =>
      buildTimeEntryDedupKey({
        projectId: entry.projectId,
        startTime: entry.startTime,
        durationMinutes: entry.durationMinutes,
        description: entry.description,
        billable: entry.billable,
      }),
    ),
  )

  let skippedCount = 0
  const entriesToCreate = sourceEntries.reduce<NewTimeEntry[]>((acc, entry) => {
    const shiftedStart = addWeeks(new Date(entry.startTime), 1)
    const dedupKey = buildTimeEntryDedupKey({
      projectId: entry.projectId,
      startTime: shiftedStart,
      durationMinutes: entry.durationMinutes,
      description: entry.description,
      billable: entry.billable,
    })

    if (existingKeys.has(dedupKey)) {
      skippedCount += 1
      return acc
    }

    existingKeys.add(dedupKey)
    acc.push({
      projectId: entry.projectId,
      description: entry.description ?? undefined,
      startTime: shiftedStart,
      endTime: entry.endTime
        ? addWeeks(new Date(entry.endTime), 1)
        : undefined,
      durationMinutes: entry.durationMinutes,
      billable: entry.billable,
    })
    return acc
  }, [])

  const createdEntries =
    entriesToCreate.length > 0
      ? await db.insert(timeEntries).values(entriesToCreate).returning()
      : []

  revalidateTag('time-entries', 'max')
  revalidateTag('projects', 'max')

  return {
    createdCount: createdEntries.length,
    skippedCount,
    sourceCount: sourceEntries.length,
  }
}
