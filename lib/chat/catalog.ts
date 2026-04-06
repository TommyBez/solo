import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { z } from 'zod'

export const catalog = defineCatalog(schema, {
  components: {
    // ── Business components (mapped to existing app components) ──────────

    StatsCards: {
      props: z.object({
        weeklyHours: z
          .number()
          .describe('Total hours tracked this week, as a decimal'),
        weeklyChange: z
          .number()
          .describe(
            'Percentage change vs last week, e.g. 12 means +12%, -5 means -5%',
          ),
        monthlyHours: z
          .number()
          .describe('Total hours tracked this month, as a decimal'),
        monthlyChange: z.number().describe('Percentage change vs last month'),
        activeProjectsCount: z.number().describe('Number of active projects'),
        activeAreasCount: z.number().describe('Number of active areas'),
        totalExpectedWeeklyHours: z
          .number()
          .describe('Sum of expected weekly hours across all areas (goal)'),
        adjustedExpectedWeeklyHours: z
          .number()
          .describe(
            'Expected weekly hours after subtracting out-of-office days for the selected week.',
          ),
        outOfOfficeDays: z
          .number()
          .describe(
            'Number of marked out-of-office days in the selected week.',
          ),
        weekLabel: z
          .string()
          .nullable()
          .describe(
            'Label for the week card header, e.g. "Mar 24 – Mar 30". Null for "This Week"',
          ),
      }),
      slots: [],
      description:
        'Dashboard summary showing 4 metric cards: weekly hours with trend, monthly hours with trend, weekly goal progress bar, and active projects/areas count. Use when the user asks for an overview, summary, or "how am I doing".',
      example: {
        weeklyHours: 32.5,
        weeklyChange: 12,
        monthlyHours: 128,
        monthlyChange: -3,
        activeProjectsCount: 5,
        activeAreasCount: 3,
        totalExpectedWeeklyHours: 40,
        adjustedExpectedWeeklyHours: 32,
        outOfOfficeDays: 1,
        weekLabel: null,
      },
    },

    DailyBreakdown: {
      props: z.object({
        data: z.array(
          z.object({
            date: z.string().describe('ISO date string, e.g. "2026-03-25"'),
            dayName: z.string().describe('Short day name, e.g. "Mon", "Tue"'),
            hours: z.number().describe('Hours tracked that day, as a decimal'),
            isOutOfOffice: z
              .boolean()
              .describe(
                'Whether the day was marked out of office and should be shown as intentional time away.',
              ),
          }),
        ),
      }),
      slots: [],
      description:
        'Bar chart showing hours tracked per day of the week. Use when the user asks about daily breakdown, daily distribution, or "which days did I work most".',
      example: {
        data: [
          {
            date: '2026-03-25',
            dayName: 'Mon',
            hours: 7.5,
            isOutOfOffice: false,
          },
          {
            date: '2026-03-26',
            dayName: 'Tue',
            hours: 0,
            isOutOfOffice: true,
          },
          {
            date: '2026-03-27',
            dayName: 'Wed',
            hours: 8.0,
            isOutOfOffice: false,
          },
          {
            date: '2026-03-28',
            dayName: 'Thu',
            hours: 5.5,
            isOutOfOffice: false,
          },
          {
            date: '2026-03-29',
            dayName: 'Fri',
            hours: 4.0,
            isOutOfOffice: false,
          },
        ],
      },
    },

    AreasComparison: {
      props: z.object({
        data: z.array(
          z.object({
            name: z.string().describe('Area name'),
            expected: z
              .number()
              .describe('Expected hours per week for this area'),
            actual: z
              .number()
              .describe('Actual hours tracked this week for this area'),
          }),
        ),
      }),
      slots: [],
      description:
        'Grouped bar chart comparing expected vs actual hours for each area. Use when the user asks about area goals, goal progress, or "am I on track per area".',
      example: {
        data: [
          { name: 'Fractional CTO', expected: 20, actual: 18.5 },
          { name: 'Solo Product', expected: 15, actual: 12 },
          { name: 'Mentorship', expected: 5, actual: 6.5 },
        ],
      },
    },

    TimeDistribution: {
      props: z.object({
        data: z.array(
          z.object({
            name: z.string().describe('Area name'),
            hours: z
              .number()
              .describe('Total hours for this area in the period'),
            color: z
              .string()
              .describe('Hex color for the area, e.g. "#6366f1"'),
          }),
        ),
      }),
      slots: [],
      description:
        'Pie/donut chart showing time distribution by area. Use when the user asks about time split, where time goes, or "what areas take most time".',
      example: {
        data: [
          { name: 'Fractional CTO', hours: 18.5, color: '#6366f1' },
          { name: 'Solo Product', hours: 12, color: '#22c55e' },
          { name: 'Mentorship', hours: 6.5, color: '#f59e0b' },
        ],
      },
    },

    RecentEntries: {
      props: z.object({
        entries: z.array(
          z.object({
            id: z.number().describe('Time entry ID'),
            description: z
              .string()
              .nullable()
              .describe('Entry description, null if blank'),
            durationMinutes: z
              .number()
              .describe('Duration in minutes, e.g. 90 for 1.5h'),
            startTime: z.string().describe('ISO datetime of when work started'),
            projectName: z.string().describe('Project name'),
            areaName: z.string().describe('Area name'),
            areaColor: z.string().describe('Hex color for the area'),
          }),
        ),
      }),
      slots: [],
      description:
        'List of time entries with project name, area color, description, duration badge, and relative time. Use when showing recent activity, a list of entries, or query results for time entries.',
      example: {
        entries: [
          {
            id: 42,
            description: 'Sprint planning and backlog grooming',
            durationMinutes: 90,
            startTime: '2026-03-30T09:00:00Z',
            projectName: 'Acme Platform',
            areaName: 'Fractional CTO',
            areaColor: '#6366f1',
          },
          {
            id: 43,
            description: 'Code review for auth module',
            durationMinutes: 45,
            startTime: '2026-03-30T11:00:00Z',
            projectName: 'Acme Platform',
            areaName: 'Fractional CTO',
            areaColor: '#6366f1',
          },
        ],
      },
    },

    ProjectCard: {
      props: z.object({
        name: z.string().describe('Project name'),
        description: z
          .string()
          .nullable()
          .describe('Project description, null if not set'),
        status: z
          .enum(['active', 'completed', 'on-hold'])
          .describe('Current project status'),
        areaName: z.string().describe('Area this project belongs to'),
        areaColor: z.string().describe('Hex color of the area'),
        clientName: z
          .string()
          .nullable()
          .describe('Client name, null if no client assigned'),
        totalHours: z.number().describe('Total hours tracked on this project'),
        hoursThisWeek: z
          .number()
          .describe('Hours tracked this week on this project'),
        expectedHours: z
          .number()
          .describe('Expected total hours for this project (0 = no target)'),
      }),
      slots: [],
      description:
        'Card displaying a single project with colored area bar, status badge, total/weekly hours, and progress toward expected hours. For multiple projects, wrap each in a Grid with columns 2 or 3.',
      example: {
        name: 'Acme Platform',
        description: 'Full-stack development for Acme Corp',
        status: 'active',
        areaName: 'Fractional CTO',
        areaColor: '#6366f1',
        clientName: 'Acme Corp',
        totalHours: 120.5,
        hoursThisWeek: 18.5,
        expectedHours: 200,
      },
    },

    ClientCard: {
      props: z.object({
        name: z.string().describe('Client name'),
        email: z.string().nullable().describe('Client email, null if not set'),
        phone: z
          .string()
          .nullable()
          .describe('Client phone number, null if not set'),
        hourlyRate: z
          .string()
          .nullable()
          .describe('Hourly rate as string, e.g. "150.00", null if not set'),
        currency: z.string().describe('Currency code, e.g. "USD", "EUR"'),
        projectCount: z.number().describe('Number of projects for this client'),
        totalBillableHours: z
          .number()
          .describe('Total billable hours tracked for this client'),
      }),
      slots: [],
      description:
        'Card showing a client with avatar, contact info, hourly rate, project count, and total billable hours. Use when the user asks about a specific client or wants to see client details.',
      example: {
        name: 'Acme Corp',
        email: 'billing@acme.com',
        phone: '+1 555-0123',
        hourlyRate: '150.00',
        currency: 'USD',
        projectCount: 3,
        totalBillableHours: 245,
      },
    },

    AreaCard: {
      props: z.object({
        name: z.string().describe('Area name'),
        description: z
          .string()
          .nullable()
          .describe('Area description, null if not set'),
        color: z.string().describe('Hex color for the area, e.g. "#6366f1"'),
        expectedHoursPerWeek: z
          .number()
          .describe('Weekly hour target for this area'),
        hoursThisWeek: z.number().describe('Actual hours tracked this week'),
        percentageComplete: z
          .number()
          .describe('Percentage of weekly goal achieved, e.g. 85 means 85%'),
        projectCount: z.number().describe('Number of projects in this area'),
      }),
      slots: [],
      description:
        'Card showing an area with color bar, weekly progress bar, hours vs target, and project count. Use when the user asks about a specific area or wants area details.',
      example: {
        name: 'Fractional CTO',
        description: 'Strategic tech leadership for startups',
        color: '#6366f1',
        expectedHoursPerWeek: 20,
        hoursThisWeek: 18.5,
        percentageComplete: 92,
        projectCount: 3,
      },
    },

    // ── Generic primitives ──────────────────────────────────────────────

    Card: {
      props: z.object({
        title: z.string().describe('Card title'),
        description: z
          .string()
          .nullable()
          .describe('Optional card subtitle/description'),
      }),
      slots: ['default'],
      description:
        'Generic container card with title and optional description. Use as a wrapper for grouping related content. Place child components inside the default slot.',
      example: {
        title: 'Weekly Summary',
        description: 'Your time tracking overview',
      },
    },

    Table: {
      props: z.object({
        columns: z
          .array(
            z.object({
              key: z.string().describe('Column data key'),
              label: z.string().describe('Column header text'),
              align: z
                .enum(['left', 'center', 'right'])
                .nullable()
                .describe('Text alignment, null for left'),
            }),
          )
          .describe('Column definitions'),
        rows: z
          .array(z.record(z.string(), z.unknown()))
          .describe('Array of row data objects keyed by column key'),
      }),
      slots: [],
      description:
        'Data table with column headers and rows. Use for tabular data like time entry lists, project comparisons, or any structured data with multiple columns. Prefer RecentEntries for time entry data.',
      example: {
        columns: [
          { key: 'project', label: 'Project', align: null },
          { key: 'hours', label: 'Hours', align: 'right' },
          { key: 'billable', label: 'Billable', align: 'center' },
        ],
        rows: [
          { project: 'Acme Platform', hours: 18.5, billable: 'Yes' },
          { project: 'Internal Tools', hours: 12, billable: 'No' },
        ],
      },
    },

    Text: {
      props: z.object({
        content: z.string().describe('The text content'),
        variant: z
          .enum(['default', 'muted', 'success', 'destructive'])
          .nullable()
          .describe('Text style variant, null for default'),
      }),
      slots: [],
      description:
        'A paragraph of text. Use for summaries, explanations, or callouts within the UI. For titles use Heading instead.',
      example: {
        content: 'You tracked 32.5 hours this week, up 12% from last week.',
        variant: null,
      },
    },

    Heading: {
      props: z.object({
        content: z.string().describe('Heading text'),
        level: z
          .enum(['h2', 'h3', 'h4'])
          .describe(
            'Heading level (h2 for sections, h3 for subsections, h4 for labels)',
          ),
      }),
      slots: [],
      description:
        'A heading for structuring content. Use h2 for major sections, h3 for subsections, h4 for small labels.',
      example: {
        content: 'Project Breakdown',
        level: 'h3',
      },
    },

    Badge: {
      props: z.object({
        text: z.string().describe('Badge text'),
        variant: z
          .enum(['default', 'secondary', 'destructive', 'outline'])
          .describe('Badge style variant'),
      }),
      slots: [],
      description:
        'Small status indicator badge. Use for labels like "Active", "Billable", "On Hold".',
      example: {
        text: 'Active',
        variant: 'default',
      },
    },

    Progress: {
      props: z.object({
        value: z.number().describe('Progress percentage 0-100'),
        label: z
          .string()
          .nullable()
          .describe('Label shown above the bar, e.g. "18.5h / 20h"'),
      }),
      slots: [],
      description:
        'Progress bar showing completion percentage. Use for goal tracking, hour targets, or any metric with a target.',
      example: {
        value: 85,
        label: '18.5h / 20h',
      },
    },

    Stack: {
      props: z.object({
        direction: z
          .enum(['horizontal', 'vertical'])
          .describe('Layout direction'),
        gap: z
          .enum(['sm', 'md', 'lg'])
          .describe('Space between items: sm=8px, md=16px, lg=24px'),
        align: z
          .enum(['start', 'center', 'end', 'stretch'])
          .nullable()
          .describe('Cross-axis alignment, null for stretch'),
      }),
      slots: ['default'],
      description:
        'Flex container for stacking child elements horizontally or vertically. Use for laying out cards, badges, or other components in a row or column.',
      example: {
        direction: 'horizontal',
        gap: 'md',
        align: null,
      },
    },

    Grid: {
      props: z.object({
        columns: z
          .enum(['1', '2', '3', '4'])
          .describe('Number of grid columns'),
        gap: z
          .enum(['sm', 'md', 'lg'])
          .describe('Space between grid items: sm=8px, md=16px, lg=24px'),
      }),
      slots: ['default'],
      description:
        'CSS grid container for arranging child elements in columns. Use columns 2 or 3 for card grids like project or client lists.',
      example: {
        columns: '2',
        gap: 'md',
      },
    },

    Alert: {
      props: z.object({
        title: z.string().describe('Alert title'),
        description: z.string().describe('Alert message body'),
        variant: z
          .enum(['default', 'destructive'])
          .describe('Alert style: default for info, destructive for warnings'),
      }),
      slots: [],
      description:
        'Alert banner for important messages. Use for warnings (low hours, missing entries), errors, or notable insights.',
      example: {
        title: 'Low Weekly Hours',
        description:
          'You have only tracked 12 hours this week, which is 60% below your 30h target.',
        variant: 'destructive',
      },
    },

    Separator: {
      props: z.object({}),
      slots: [],
      description:
        'Horizontal divider line. Use between sections to create visual separation.',
      example: {},
    },
  },

  actions: {},
})
