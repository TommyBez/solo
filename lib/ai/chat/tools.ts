import { tool } from 'ai'
import { endOfWeek, startOfWeek, subWeeks } from 'date-fns'
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { areas, clients, projects, timeEntries } from '@/lib/db/schema'

async function getOrgProjectIds(organizationId: string): Promise<number[]> {
  const orgProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(areas, eq(projects.areaId, areas.id))
    .where(eq(areas.organizationId, organizationId))
  return orgProjects.map((p) => p.id)
}

async function getOrgAreaIds(organizationId: string): Promise<number[]> {
  const orgAreas = await db
    .select({ id: areas.id })
    .from(areas)
    .where(eq(areas.organizationId, organizationId))
  return orgAreas.map((a) => a.id)
}

export function createChatTools(organizationId: string) {
  return {
    getTimeEntries: tool({
      description:
        'Get time entries for the user. Can filter by date range, project, and limit results. Returns entries with project and area info.',
      inputSchema: z.object({
        startDate: z
          .string()
          .optional()
          .describe('ISO date string for start of range'),
        endDate: z
          .string()
          .optional()
          .describe('ISO date string for end of range'),
        projectId: z.number().optional().describe('Filter by project ID'),
        limit: z
          .number()
          .max(50)
          .optional()
          .default(20)
          .describe('Max entries to return (default 20, max 50)'),
      }),
      execute: async ({ startDate, endDate, projectId, limit }) => {
        const orgProjectIds = await getOrgProjectIds(organizationId)
        if (orgProjectIds.length === 0) {
          return { entries: [] }
        }

        const conditions = [inArray(timeEntries.projectId, orgProjectIds)]
        if (projectId) {
          conditions.push(eq(timeEntries.projectId, projectId))
        }
        if (startDate) {
          conditions.push(gte(timeEntries.startTime, new Date(startDate)))
        }
        if (endDate) {
          conditions.push(lte(timeEntries.startTime, new Date(endDate)))
        }

        const entries = await db.query.timeEntries.findMany({
          where: and(...conditions),
          orderBy: [desc(timeEntries.startTime)],
          limit,
          with: { project: { with: { area: true } } },
        })

        return {
          entries: entries.map((e) => ({
            id: e.id,
            description: e.description,
            startTime: e.startTime.toISOString(),
            endTime: e.endTime?.toISOString() ?? null,
            durationMinutes: e.durationMinutes,
            billable: e.billable,
            projectName: e.project.name,
            projectId: e.project.id,
            areaName: e.project.area.name,
            areaColor: e.project.area.color,
          })),
        }
      },
    }),

    getProjects: tool({
      description:
        'Get projects for the user. Can filter by area, status, and whether to include archived.',
      inputSchema: z.object({
        areaId: z.number().optional().describe('Filter by area ID'),
        status: z
          .enum(['active', 'completed', 'on-hold'])
          .optional()
          .describe('Filter by status'),
        includeArchived: z.boolean().optional().default(false),
      }),
      execute: async ({ areaId, status, includeArchived }) => {
        const orgAreaIds = await getOrgAreaIds(organizationId)
        if (orgAreaIds.length === 0) {
          return { projects: [] }
        }

        const conditions = [inArray(projects.areaId, orgAreaIds)]
        if (areaId) {
          conditions.push(eq(projects.areaId, areaId))
        }
        if (status) {
          conditions.push(eq(projects.status, status))
        }
        if (!includeArchived) {
          conditions.push(eq(projects.archived, false))
        }

        const result = await db.query.projects.findMany({
          where: and(...conditions),
          orderBy: [desc(projects.createdAt)],
          limit: 30,
          with: { area: true, client: true },
        })

        return {
          projects: result.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            expectedHours: p.expectedHours,
            recurring: p.recurring,
            hourlyRate: p.hourlyRate,
            deadline: p.deadline?.toISOString() ?? null,
            archived: p.archived,
            areaName: p.area.name,
            areaColor: p.area.color,
            areaId: p.area.id,
            clientName: p.client?.name ?? null,
          })),
        }
      },
    }),

    getAreas: tool({
      description:
        'Get areas (broad work contexts like "Fractional CTO", "Mentorship") with their project counts.',
      inputSchema: z.object({
        includeArchived: z.boolean().optional().default(false),
      }),
      execute: async ({ includeArchived }) => {
        const conditions = includeArchived
          ? eq(areas.organizationId, organizationId)
          : and(
              eq(areas.organizationId, organizationId),
              eq(areas.archived, false),
            )

        const result = await db.query.areas.findMany({
          where: conditions,
          orderBy: [desc(areas.createdAt)],
          with: {
            projects: { where: eq(projects.archived, false) },
          },
        })

        return {
          areas: result.map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            color: a.color,
            expectedHoursPerWeek: a.expectedHoursPerWeek,
            archived: a.archived,
            projectCount: a.projects.length,
          })),
        }
      },
    }),

    getClients: tool({
      description: 'Get clients with their project counts and contact info.',
      inputSchema: z.object({
        includeArchived: z.boolean().optional().default(false),
      }),
      execute: async ({ includeArchived }) => {
        const result = await db.query.clients.findMany({
          where: includeArchived
            ? eq(clients.organizationId, organizationId)
            : and(
                eq(clients.organizationId, organizationId),
                eq(clients.archived, false),
              ),
          orderBy: [desc(clients.createdAt)],
          with: {
            projects: {
              where: eq(projects.archived, false),
            },
          },
        })

        return {
          clients: result.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            hourlyRate: c.hourlyRate,
            currency: c.currency,
            archived: c.archived,
            projectCount: c.projects.length,
          })),
        }
      },
    }),

    getDashboardStats: tool({
      description:
        'Get dashboard statistics: weekly hours, monthly hours, active areas/projects, time breakdown by area and project, daily breakdown, and area goal comparisons.',
      inputSchema: z.object({
        weeksAgo: z
          .number()
          .min(0)
          .max(52)
          .optional()
          .default(0)
          .describe('How many weeks ago (0 = current week)'),
      }),
      execute: async ({ weeksAgo }) => {
        const weekStartsOn = 1 as const // Monday default
        const orgProjectIds = await getOrgProjectIds(organizationId)
        const now = new Date()
        const currentWeekStart = startOfWeek(now, { weekStartsOn })
        const weekStart =
          weeksAgo === 0
            ? currentWeekStart
            : subWeeks(currentWeekStart, weeksAgo)
        const weekEnd = endOfWeek(weekStart, { weekStartsOn })

        async function getEntries(start: Date, end: Date) {
          if (orgProjectIds.length === 0) {
            return []
          }
          return await db.query.timeEntries.findMany({
            where: and(
              inArray(timeEntries.projectId, orgProjectIds),
              gte(timeEntries.startTime, start),
              lte(timeEntries.startTime, end),
            ),
            with: { project: { with: { area: true } } },
          })
        }

        const prevWeekStart = subWeeks(weekStart, 1)
        const [weekEntries, prevWeekEntries] = await Promise.all([
          getEntries(weekStart, weekEnd),
          getEntries(prevWeekStart, weekStart),
        ])

        const weeklyMinutes = weekEntries.reduce(
          (sum, e) => sum + e.durationMinutes,
          0,
        )
        const prevWeeklyMinutes = prevWeekEntries.reduce(
          (sum, e) => sum + e.durationMinutes,
          0,
        )

        const activeAreas = await db.query.areas.findMany({
          where: and(
            eq(areas.organizationId, organizationId),
            eq(areas.archived, false),
          ),
        })
        const orgAreaIds = activeAreas.map((a) => a.id)
        const activeProjectCount =
          orgAreaIds.length > 0
            ? (
                await db.query.projects.findMany({
                  where: and(
                    inArray(projects.areaId, orgAreaIds),
                    eq(projects.archived, false),
                    eq(projects.status, 'active'),
                  ),
                })
              ).length
            : 0

        const timeByArea = weekEntries.reduce(
          (acc, entry) => {
            const name = entry.project.area.name
            acc[name] = (acc[name] ?? 0) + entry.durationMinutes
            return acc
          },
          {} as Record<string, number>,
        )

        let weeklyChange = 0
        if (prevWeeklyMinutes > 0) {
          weeklyChange = Math.round(
            ((weeklyMinutes - prevWeeklyMinutes) / prevWeeklyMinutes) * 100,
          )
        } else if (weeklyMinutes > 0) {
          weeklyChange = 100
        }

        return {
          weekStartDate: weekStart.toISOString(),
          weeklyHours: Math.round((weeklyMinutes / 60) * 10) / 10,
          prevWeeklyHours: Math.round((prevWeeklyMinutes / 60) * 10) / 10,
          weeklyChange,
          activeAreasCount: activeAreas.length,
          activeProjectsCount: activeProjectCount,
          totalExpectedWeeklyHours: activeAreas.reduce(
            (sum, a) => sum + a.expectedHoursPerWeek,
            0,
          ),
          timeByArea: Object.entries(timeByArea).map(([name, minutes]) => ({
            name,
            hours: Math.round((minutes / 60) * 10) / 10,
          })),
        }
      },
    }),
  }
}
