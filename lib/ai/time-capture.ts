'use server'

import { generateText, Output } from 'ai'
import { and, desc, eq, gte, inArray } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { requireOrganization } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { aiSuggestionDismissals, projects, timeEntries } from '@/lib/db/schema'
import { getGitHubActivityForUser } from '@/lib/github/service'
import type { GitHubActivity } from '@/lib/github/types'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/types'
import {
  type CachedSuggestion,
  getCachedSuggestions,
  setCachedSuggestions,
  updateSuggestionStatus,
} from '@/lib/redis/suggestions-cache'
import { AI_MODELS } from './models'
import {
  buildDescriptionPrompt,
  buildEntrySuggestionPrompt,
  buildGitHubSuggestionPrompt,
} from './prompts'
import {
  type DescriptionEnhancement,
  descriptionEnhancementSchema,
  type EntrySuggestion,
  entrySuggestionSchema,
  githubSuggestionSchema,
  type SuggestionType,
} from './schemas'

const GITHUB_CLUSTER_WINDOW_MINUTES = 180
const MAX_GITHUB_SUGGESTIONS = 5

interface GitHubActivityCluster {
  activities: GitHubActivity[]
  date: string
  id: string
  repoFullName: string
  repoName: string
  timeWindowEnd: string
  timeWindowStart: string
}

function getIsoDate(value: string): string {
  return value.split('T')[0]
}

function getMinutesBetween(first: string, second: string): number {
  return Math.round(
    Math.abs(new Date(second).getTime() - new Date(first).getTime()) / 60_000,
  )
}

function clusterGitHubActivities(
  activities: GitHubActivity[],
): GitHubActivityCluster[] {
  const sortedActivities = [...activities].sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  )

  const clusters: GitHubActivityCluster[] = []

  for (const activity of sortedActivities) {
    const activityDate = getIsoDate(activity.timestamp)
    const previousCluster = clusters.at(-1)
    const previousActivity = previousCluster?.activities.at(-1)
    const isSameCluster =
      previousCluster &&
      previousActivity &&
      previousCluster.repoFullName === activity.repoFullName &&
      previousCluster.date === activityDate &&
      getMinutesBetween(previousActivity.timestamp, activity.timestamp) <=
        GITHUB_CLUSTER_WINDOW_MINUTES

    if (isSameCluster && previousCluster) {
      previousCluster.activities.push(activity)
      previousCluster.timeWindowEnd = activity.timestamp
      continue
    }

    clusters.push({
      activities: [activity],
      date: activityDate,
      id: `cluster-${activity.id}`,
      repoFullName: activity.repoFullName,
      repoName: activity.repoName,
      timeWindowEnd: activity.timestamp,
      timeWindowStart: activity.timestamp,
    })
  }

  return clusters
}

function summarizeClusterActivities(cluster: GitHubActivityCluster): string[] {
  return cluster.activities.slice(0, 4).map((activity) => {
    let typeLabel = 'Review'
    if (activity.type === 'commit') {
      typeLabel = 'Commit'
    } else if (activity.type === 'pr_merged') {
      typeLabel = 'Merged PR'
    } else if (activity.type === 'pr_opened') {
      typeLabel = 'Opened PR'
    }

    return `[${typeLabel}] ${activity.description}`
  })
}

function buildDuplicateCheck(
  date: string,
  projectId: number,
  recentEntries: Array<{
    date: string
    durationMinutes: number
    projectId: number
  }>,
): CachedSuggestion['metadata']['duplicateCheck'] {
  const entriesOnDate = recentEntries.filter((entry) => entry.date === date)
  const projectEntriesOnDate = entriesOnDate.filter(
    (entry) => entry.projectId === projectId,
  )

  const minutesLoggedOnDate = entriesOnDate.reduce(
    (sum, entry) => sum + entry.durationMinutes,
    0,
  )
  const projectMinutesOnDate = projectEntriesOnDate.reduce(
    (sum, entry) => sum + entry.durationMinutes,
    0,
  )

  let summary = `No Solo entries are logged on ${date}.`
  if (projectEntriesOnDate.length > 0) {
    summary = `Solo already has ${projectEntriesOnDate.length} tracked entr${projectEntriesOnDate.length === 1 ? 'y' : 'ies'} for this project on ${date}, totaling ${projectMinutesOnDate} minutes.`
  } else if (entriesOnDate.length > 0) {
    summary = `Solo already has ${entriesOnDate.length} entr${entriesOnDate.length === 1 ? 'y' : 'ies'} on ${date}, totaling ${minutesLoggedOnDate} minutes, but none for this project.`
  }

  return {
    existingEntryCountOnDate: entriesOnDate.length,
    hasProjectEntryOnDate: projectEntriesOnDate.length > 0,
    minutesLoggedOnDate,
    projectMinutesOnDate,
    summary,
  }
}

// Enhance a vague or empty description
export async function enhanceDescription(params: {
  currentDescription: string
  projectId: number
  projectName: string
  areaName: string
  durationMinutes: number
}): Promise<DescriptionEnhancement | null> {
  try {
    const { organizationId } = await requireOrganization()

    // Verify project belongs to current organization
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, params.projectId),
      with: { area: true },
    })

    if (!project || project.area.organizationId !== organizationId) {
      console.error('Project not found or does not belong to organization')
      return null
    }

    // Get recent entries for this project for context
    const recentEntries = await db.query.timeEntries.findMany({
      where: eq(timeEntries.projectId, params.projectId),
      orderBy: [desc(timeEntries.startTime)],
      limit: 10,
    })

    const recentDescriptions = recentEntries
      .map((e) => e.description)
      .filter((d): d is string => d !== null && d.trim().length > 0)

    const prompt = buildDescriptionPrompt({
      currentDescription: params.currentDescription,
      projectName: params.projectName,
      areaName: params.areaName,
      durationMinutes: params.durationMinutes,
      recentDescriptions,
    })

    const { output } = await generateText({
      model: AI_MODELS.descriptionEnhancement,
      output: Output.object({ schema: descriptionEnhancementSchema }),
      prompt,
      maxOutputTokens: 200,
    })

    return output ?? null
  } catch (error) {
    console.error('Failed to enhance description:', error)
    return null
  }
}

// Suggest a time entry from a calendar event
export async function suggestEntryFromEvent(params: {
  calendarEvent: GoogleCalendarEvent
}): Promise<EntrySuggestion | null> {
  try {
    const { organizationId } = await requireOrganization()

    // Get active projects with areas
    const activeProjects = await db.query.projects.findMany({
      where: eq(projects.archived, false),
      with: {
        area: true,
      },
    })

    // Filter to only projects in this organization
    const orgProjects = activeProjects.filter(
      (p) => p.area.organizationId === organizationId,
    )

    if (orgProjects.length === 0) {
      return null
    }

    // Get recent entries for context (only from org's projects)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const orgProjectIds = orgProjects.map((p) => p.id)

    // Only query if we have org projects
    const recentEntries =
      orgProjectIds.length > 0
        ? await db.query.timeEntries.findMany({
            where: and(
              gte(timeEntries.startTime, weekAgo),
              inArray(timeEntries.projectId, orgProjectIds),
            ),
            orderBy: [desc(timeEntries.startTime)],
            limit: 10,
            with: {
              project: true,
            },
          })
        : []

    const prompt = buildEntrySuggestionPrompt({
      calendarEvent: params.calendarEvent,
      projects: orgProjects.map((p) => ({
        id: p.id,
        name: p.name,
        areaName: p.area.name,
      })),
      recentEntries: recentEntries.map((e) => ({
        projectName: e.project.name,
        description: e.description,
      })),
    })

    const { output } = await generateText({
      model: AI_MODELS.entrySuggestion,
      output: Output.object({ schema: entrySuggestionSchema }),
      prompt,
      maxOutputTokens: 300,
    })

    return output ?? null
  } catch (error) {
    console.error('Failed to suggest entry from event:', error)
    return null
  }
}

// Dismiss a suggestion to avoid re-surfacing
export async function dismissSuggestion(params: {
  suggestionType: SuggestionType
  suggestionHash: string
  sourceEventId?: string
}): Promise<{ success: boolean }> {
  try {
    const { session, organizationId } = await requireOrganization()

    await db.insert(aiSuggestionDismissals).values({
      userId: session.user.id,
      organizationId,
      suggestionType: params.suggestionType,
      suggestionHash: params.suggestionHash,
      sourceEventId: params.sourceEventId,
    })

    revalidateTag('ai-suggestions', 'max')

    return { success: true }
  } catch (error) {
    console.error('Failed to dismiss suggestion:', error)
    return { success: false }
  }
}

// Generate AI suggestions from GitHub activity
export async function generateGitHubSuggestions(params: {
  forceRefresh?: boolean
}): Promise<{
  suggestions: CachedSuggestion[]
  generatedAt: string | null
  fromCache: boolean
}> {
  try {
    const { session, organizationId } = await requireOrganization()

    // Check cache first (unless force refresh)
    if (!params.forceRefresh) {
      const cached = await getCachedSuggestions(organizationId, session.user.id)
      if (cached) {
        const pendingSuggestions = cached.suggestions.filter(
          (s) => s.status === 'pending',
        )
        return {
          suggestions: pendingSuggestions,
          generatedAt: cached.generatedAt,
          fromCache: true,
        }
      }
    }

    // Get active projects with areas
    const activeProjects = await db.query.projects.findMany({
      where: eq(projects.archived, false),
      with: {
        area: true,
      },
    })

    // Filter to only projects in this organization
    const orgProjects = activeProjects.filter(
      (p) => p.area.organizationId === organizationId,
    )

    if (orgProjects.length === 0) {
      return { suggestions: [], generatedAt: null, fromCache: false }
    }

    // Fetch GitHub activity from the past 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const githubActivity = await getGitHubActivityForUser({
      userId: session.user.id,
      since: weekAgo,
    })

    if (githubActivity.length === 0) {
      // Cache empty result to avoid re-fetching
      await setCachedSuggestions(organizationId, session.user.id, [])
      return {
        suggestions: [],
        generatedAt: new Date().toISOString(),
        fromCache: false,
      }
    }

    const activityClusters = clusterGitHubActivities(githubActivity)
    if (activityClusters.length === 0) {
      await setCachedSuggestions(organizationId, session.user.id, [])
      return {
        suggestions: [],
        generatedAt: new Date().toISOString(),
        fromCache: false,
      }
    }

    // Get recent time entries to avoid duplicates and provide project evidence
    const orgProjectIds = orgProjects.map((p) => p.id)
    const recentEntries =
      orgProjectIds.length > 0
        ? await db.query.timeEntries.findMany({
            where: and(
              gte(timeEntries.startTime, weekAgo),
              inArray(timeEntries.projectId, orgProjectIds),
            ),
            orderBy: [desc(timeEntries.startTime)],
            limit: 50,
            with: {
              project: true,
            },
          })
        : []

    // Build prompt and call AI
    const prompt = buildGitHubSuggestionPrompt({
      clusters: activityClusters.map((cluster) => ({
        activityCount: cluster.activities.length,
        clusterId: cluster.id,
        date: cluster.date,
        repoFullName: cluster.repoFullName,
        repoName: cluster.repoName,
        summaries: summarizeClusterActivities(cluster),
        timeWindowEnd: cluster.timeWindowEnd,
        timeWindowStart: cluster.timeWindowStart,
      })),
      projects: orgProjects.map((p) => ({
        id: p.id,
        name: p.name,
        areaName: p.area.name,
      })),
      existingEntries: recentEntries.map((e) => ({
        projectId: e.project.id,
        projectName: e.project.name,
        date: e.startTime.toISOString().split('T')[0],
        description: e.description,
        durationMinutes: e.durationMinutes,
      })),
    })

    const { output } = await generateText({
      model: AI_MODELS.entrySuggestion,
      output: Output.object({ schema: githubSuggestionSchema }),
      prompt,
      maxOutputTokens: 1000,
    })

    // Transform AI response to cached suggestions
    const generatedAt = new Date().toISOString()
    const projectNameById = new Map(
      orgProjects.map((project) => [project.id, project.name]),
    )
    const recentEntrySnapshots = recentEntries.map((entry) => ({
      date: entry.startTime.toISOString().split('T')[0],
      durationMinutes: entry.durationMinutes,
      projectId: entry.project.id,
    }))
    const mappedSuggestions = (output?.suggestions || [])
      .filter((suggestion) => suggestion.confidence === 'high')
      .flatMap((suggestion) => {
        const cluster = activityClusters.find(
          (activityCluster) => activityCluster.id === suggestion.clusterId,
        )
        if (!cluster) {
          return []
        }

        if (!projectNameById.has(suggestion.projectId)) {
          return []
        }

        const duplicateCheck = buildDuplicateCheck(
          suggestion.date,
          suggestion.projectId,
          recentEntrySnapshots,
        )

        const existingEntryEvidence = recentEntries
          .filter((entry) => entry.project.id === suggestion.projectId)
          .slice(0, 2)
          .map((entry) => ({
            date: entry.startTime.toISOString().split('T')[0],
            description: entry.description || '(no description)',
            durationMinutes: entry.durationMinutes,
            projectName: entry.project.name,
          }))

        return [
          {
            confidence: suggestion.confidence,
            date: suggestion.date,
            description: suggestion.description,
            durationMinutes: suggestion.durationMinutes,
            generatedAt,
            id: `github-missing-${suggestion.clusterId}`,
            metadata: {
              activityCount: cluster.activities.length,
              activityIds: cluster.activities.map((activity) => activity.id),
              activityTypes: [
                ...new Set(cluster.activities.map((activity) => activity.type)),
              ],
              duplicateCheck,
              existingEntryEvidence,
              primaryUrl: cluster.activities[0]?.url || '',
              repoFullName: cluster.repoFullName,
              repoName: cluster.repoName,
              timeWindowEnd: cluster.timeWindowEnd,
              timeWindowStart: cluster.timeWindowStart,
              titles: cluster.activities.map(
                (activity) => activity.description,
              ),
              urls: cluster.activities
                .map((activity) => activity.url)
                .filter(
                  (url, index, allUrls) =>
                    Boolean(url) && allUrls.indexOf(url) === index,
                ),
            },
            projectId: suggestion.projectId,
            reasoning: suggestion.reasoning,
            sourceId: suggestion.clusterId,
            status: 'pending' as const,
            type: 'missing_entry' as const,
          },
        ]
      })
      .slice(0, MAX_GITHUB_SUGGESTIONS)

    // Cache the suggestions
    await setCachedSuggestions(
      organizationId,
      session.user.id,
      mappedSuggestions,
    )

    return {
      suggestions: mappedSuggestions,
      generatedAt,
      fromCache: false,
    }
  } catch (error) {
    console.error('Failed to generate GitHub suggestions:', error)
    return { suggestions: [], generatedAt: null, fromCache: false }
  }
}

// Accept or dismiss a cached suggestion
export async function updateCachedSuggestionStatus(params: {
  suggestionId: string
  status: 'accepted' | 'dismissed'
}): Promise<{ success: boolean }> {
  try {
    const { session, organizationId } = await requireOrganization()

    await updateSuggestionStatus(
      organizationId,
      session.user.id,
      params.suggestionId,
      params.status,
    )

    return { success: true }
  } catch (error) {
    console.error('Failed to update suggestion status:', error)
    return { success: false }
  }
}
