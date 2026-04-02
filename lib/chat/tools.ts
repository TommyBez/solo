import { tool } from 'ai'
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { areas, clients, projects, timeEntries } from '@/lib/db/schema'

// ── Helpers ────────────────────────────────────────────────────────────

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

// ── Tool factory ───────────────────────────────────────────────────────

export function createChatTools(organizationId: string) {
  return {
    queryTimeEntries: tool({
      description:
        'Query time entries with optional filters. Returns entries with project name, area name, area color, duration, and billable status. Use this when the user asks about specific time entries, recent activity, or wants to see what was tracked.',
      inputSchema: z.object({
        startDate: z
          .string()
          .describe('ISO date for range start, e.g. "2026-03-24"'),
        endDate: z
          .string()
          .describe('ISO date for range end, e.g. "2026-03-30"'),
        projectId: z
          .number()
          .nullable()
          .describe('Filter by project ID, null for all projects'),
        limit: z
          .number()
          .nullable()
          .describe('Max entries to return, null defaults to 50. Max 100.'),
      }),
      execute: async ({ startDate, endDate, projectId, limit }) => {
        const orgProjectIds = await getOrgProjectIds(organizationId)
        if (orgProjectIds.length === 0) {
          return { entries: [] }
        }

        const conditions = [
          inArray(timeEntries.projectId, orgProjectIds),
          gte(timeEntries.startTime, new Date(startDate)),
          lte(timeEntries.startTime, new Date(endDate)),
        ]
        if (projectId) {
          conditions.push(eq(timeEntries.projectId, projectId))
        }

        const rows = await db.query.timeEntries.findMany({
          where: and(...conditions),
          orderBy: [desc(timeEntries.startTime)],
          limit: Math.min(limit ?? 50, 100),
          with: {
            project: { with: { area: true } },
          },
        })

        return {
          entries: rows.map((e) => ({
            id: e.id,
            description: e.description,
            durationMinutes: e.durationMinutes,
            startTime: e.startTime.toISOString(),
            billable: e.billable,
            projectId: e.projectId,
            projectName: e.project.name,
            areaName: e.project.area.name,
            areaColor: e.project.area.color,
          })),
          totalCount: rows.length,
          totalMinutes: rows.reduce((s, e) => s + e.durationMinutes, 0),
        }
      },
    }),

    getProjectStats: tool({
      description:
        'Get all projects with stats: total hours, hours this week, status, area, and client name. Use when the user asks about projects, project comparisons, or wants to see project-level data.',
      inputSchema: z.object({
        includeArchived: z
          .boolean()
          .describe('Include archived projects. Default false.'),
      }),
      execute: async ({ includeArchived }) => {
        const orgAreaIds = await getOrgAreaIds(organizationId)
        if (orgAreaIds.length === 0) {
          return { projects: [] }
        }

        const conditions = [inArray(projects.areaId, orgAreaIds)]
        if (!includeArchived) {
          conditions.push(eq(projects.archived, false))
        }

        const rows = await db.query.projects.findMany({
          where: and(...conditions),
          orderBy: [desc(projects.createdAt)],
          with: {
            area: true,
            client: true,
            timeEntries: true,
          },
        })

        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

        return {
          projects: rows.map((p) => {
            const totalMinutes = p.timeEntries.reduce(
              (s, e) => s + e.durationMinutes,
              0,
            )
            const weekMinutes = p.timeEntries
              .filter((e) => e.startTime >= weekStart)
              .reduce((s, e) => s + e.durationMinutes, 0)

            return {
              id: p.id,
              name: p.name,
              description: p.description,
              status: p.status,
              areaName: p.area.name,
              areaColor: p.area.color,
              clientName: p.client?.name ?? null,
              totalHours: Math.round((totalMinutes / 60) * 10) / 10,
              hoursThisWeek: Math.round((weekMinutes / 60) * 10) / 10,
              expectedHours: p.expectedHours,
              entryCount: p.timeEntries.length,
            }
          }),
        }
      },
    }),

    getClientSummary: tool({
      description:
        'Get all clients with their hourly rate, project count, and total billable hours. Use when the user asks about clients, billing, or revenue.',
      inputSchema: z.object({
        includeArchived: z
          .boolean()
          .describe('Include archived clients. Default false.'),
      }),
      execute: async ({ includeArchived }) => {
        const conditions = [eq(clients.organizationId, organizationId)]
        if (!includeArchived) {
          conditions.push(eq(clients.archived, false))
        }

        const rows = await db.query.clients.findMany({
          where: and(...conditions),
          orderBy: [desc(clients.createdAt)],
          with: {
            projects: {
              with: {
                timeEntries: true,
              },
            },
          },
        })

        return {
          clients: rows.map((c) => {
            const billableMinutes = c.projects.reduce(
              (s, p) =>
                s +
                p.timeEntries
                  .filter((e) => e.billable)
                  .reduce((s2, e) => s2 + e.durationMinutes, 0),
              0,
            )

            return {
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone,
              hourlyRate: c.hourlyRate,
              currency: c.currency,
              projectCount: c.projects.length,
              totalBillableHours: Math.round((billableMinutes / 60) * 10) / 10,
            }
          }),
        }
      },
    }),

    getAreaBreakdown: tool({
      description:
        'Get all areas with project counts, weekly target hours, and actual hours this week. Use when the user asks about areas, workload balance, or goal tracking.',
      inputSchema: z.object({
        includeArchived: z
          .boolean()
          .describe('Include archived areas. Default false.'),
      }),
      execute: async ({ includeArchived }) => {
        const conditions = [eq(areas.organizationId, organizationId)]
        if (!includeArchived) {
          conditions.push(eq(areas.archived, false))
        }

        const rows = await db.query.areas.findMany({
          where: and(...conditions),
          orderBy: [desc(areas.createdAt)],
          with: {
            projects: {
              with: {
                timeEntries: true,
              },
            },
          },
        })

        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

        return {
          areas: rows.map((a) => {
            const weekMinutes = a.projects.reduce(
              (s, p) =>
                s +
                p.timeEntries
                  .filter((e) => e.startTime >= weekStart)
                  .reduce((s2, e) => s2 + e.durationMinutes, 0),
              0,
            )
            const totalMinutes = a.projects.reduce(
              (s, p) =>
                s + p.timeEntries.reduce((s2, e) => s2 + e.durationMinutes, 0),
              0,
            )
            const hoursThisWeek = Math.round((weekMinutes / 60) * 10) / 10

            return {
              id: a.id,
              name: a.name,
              description: a.description,
              color: a.color,
              expectedHoursPerWeek: a.expectedHoursPerWeek,
              hoursThisWeek,
              totalHours: Math.round((totalMinutes / 60) * 10) / 10,
              percentageComplete:
                a.expectedHoursPerWeek > 0
                  ? Math.round((hoursThisWeek / a.expectedHoursPerWeek) * 100)
                  : 0,
              projectCount: a.projects.length,
            }
          }),
        }
      },
    }),

    getAggregatedStats: tool({
      description:
        'Get aggregated time tracking stats: total hours, billable vs non-billable, hours by day of week, and comparison with previous period. Use when the user asks for overall stats, summaries, trends, or "how am I doing".',
      inputSchema: z.object({
        period: z
          .enum(['week', 'month'])
          .describe(
            'Aggregation period. "week" = current week, "month" = current month.',
          ),
      }),
      execute: async ({ period }) => {
        const orgProjectIds = await getOrgProjectIds(organizationId)
        if (orgProjectIds.length === 0) {
          return {
            totalHours: 0,
            billableHours: 0,
            nonBillableHours: 0,
            previousPeriodHours: 0,
            changePercent: 0,
            dailyBreakdown: [],
          }
        }

        const now = new Date()
        let periodStart: Date
        let periodEnd: Date
        let prevStart: Date
        let prevEnd: Date

        if (period === 'week') {
          periodStart = startOfWeek(now, { weekStartsOn: 1 })
          periodEnd = endOfWeek(now, { weekStartsOn: 1 })
          prevStart = subWeeks(periodStart, 1)
          prevEnd = subWeeks(periodEnd, 1)
        } else {
          periodStart = startOfMonth(now)
          periodEnd = endOfMonth(now)
          prevStart = startOfMonth(subMonths(now, 1))
          prevEnd = endOfMonth(subMonths(now, 1))
        }

        const [currentEntries, prevEntries] = await Promise.all([
          db.query.timeEntries.findMany({
            where: and(
              inArray(timeEntries.projectId, orgProjectIds),
              gte(timeEntries.startTime, periodStart),
              lte(timeEntries.startTime, periodEnd),
            ),
            with: { project: { with: { area: true } } },
          }),
          db.query.timeEntries.findMany({
            where: and(
              inArray(timeEntries.projectId, orgProjectIds),
              gte(timeEntries.startTime, prevStart),
              lte(timeEntries.startTime, prevEnd),
            ),
          }),
        ])

        const totalMinutes = currentEntries.reduce(
          (s, e) => s + e.durationMinutes,
          0,
        )
        const billableMinutes = currentEntries
          .filter((e) => e.billable)
          .reduce((s, e) => s + e.durationMinutes, 0)
        const prevTotalMinutes = prevEntries.reduce(
          (s, e) => s + e.durationMinutes,
          0,
        )
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10
        const prevHours = Math.round((prevTotalMinutes / 60) * 10) / 10
        const changePercent =
          prevHours > 0
            ? Math.round(((totalHours - prevHours) / prevHours) * 100)
            : 0

        // Daily breakdown
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const dailyMap = new Map<string, number>()
        for (const entry of currentEntries) {
          const dateKey = entry.startTime.toISOString().slice(0, 10)
          dailyMap.set(
            dateKey,
            (dailyMap.get(dateKey) ?? 0) + entry.durationMinutes,
          )
        }

        const dailyBreakdown = Array.from(dailyMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, minutes]) => ({
            date,
            dayName: dayNames[new Date(date).getDay()],
            hours: Math.round((minutes / 60) * 10) / 10,
          }))

        // By area
        const areaMap = new Map<
          string,
          { name: string; minutes: number; color: string }
        >()
        for (const entry of currentEntries) {
          const areaName = entry.project.area.name
          const existing = areaMap.get(areaName) ?? {
            name: areaName,
            minutes: 0,
            color: entry.project.area.color,
          }
          existing.minutes += entry.durationMinutes
          areaMap.set(areaName, existing)
        }

        const byArea = Array.from(areaMap.values()).map((a) => ({
          name: a.name,
          hours: Math.round((a.minutes / 60) * 10) / 10,
          color: a.color,
        }))

        // Active counts
        const activeProjectIds = new Set(currentEntries.map((e) => e.projectId))
        const activeAreaNames = new Set(
          currentEntries.map((e) => e.project.area.name),
        )

        // Get expected weekly hours from areas
        const orgAreas = await db.query.areas.findMany({
          where: and(
            eq(areas.organizationId, organizationId),
            eq(areas.archived, false),
          ),
          columns: { expectedHoursPerWeek: true },
        })
        const totalExpectedWeeklyHours = orgAreas.reduce(
          (s, a) => s + a.expectedHoursPerWeek,
          0,
        )

        return {
          period,
          totalHours,
          billableHours: Math.round((billableMinutes / 60) * 10) / 10,
          nonBillableHours:
            Math.round(((totalMinutes - billableMinutes) / 60) * 10) / 10,
          previousPeriodHours: prevHours,
          changePercent,
          dailyBreakdown,
          byArea,
          activeProjectsCount: activeProjectIds.size,
          activeAreasCount: activeAreaNames.size,
          totalExpectedWeeklyHours,
        }
      },
    }),
  }
}
