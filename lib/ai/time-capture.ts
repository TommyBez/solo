'use server'

import { generateText, Output } from 'ai'
import { requireOrganization } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { aiSuggestionDismissals, timeEntries, projects, areas } from '@/lib/db/schema'
import { eq, and, desc, gte, inArray } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import {
  descriptionEnhancementSchema,
  entrySuggestionSchema,
  githubSuggestionSchema,
  type DescriptionEnhancement,
  type EntrySuggestion,
  type SuggestionType,
} from './schemas'
import {
  buildDescriptionPrompt,
  buildEntrySuggestionPrompt,
  buildGitHubSuggestionPrompt,
} from './prompts'
import { AI_MODELS } from './models'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/types'
import { getGitHubActivityForUser } from '@/lib/github/service'
import {
  getCachedSuggestions,
  setCachedSuggestions,
  updateSuggestionStatus,
  type CachedSuggestion,
} from '@/lib/redis/suggestions-cache'

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
      (p) => p.area.organizationId === organizationId
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
              inArray(timeEntries.projectId, orgProjectIds)
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
          (s) => s.status === 'pending'
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
      (p) => p.area.organizationId === organizationId
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

    // Get recent time entries to avoid duplicates
    const orgProjectIds = orgProjects.map((p) => p.id)
    const recentEntries =
      orgProjectIds.length > 0
        ? await db.query.timeEntries.findMany({
            where: and(
              gte(timeEntries.startTime, weekAgo),
              inArray(timeEntries.projectId, orgProjectIds)
            ),
            orderBy: [desc(timeEntries.startTime)],
            limit: 50,
          })
        : []

    // Build prompt and call AI
    const prompt = buildGitHubSuggestionPrompt({
      activities: githubActivity,
      projects: orgProjects.map((p) => ({
        id: p.id,
        name: p.name,
        areaName: p.area.name,
      })),
      existingEntries: recentEntries.map((e) => ({
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
    const suggestions: CachedSuggestion[] = (output?.suggestions || []).map(
      (s) => {
        const activity = githubActivity.find((a) => a.id === s.activityId)
        const activityType = activity?.type || 'commit'

        return {
          id: `github-${s.activityId}`,
          type:
            activityType === 'commit'
              ? 'github_commit'
              : activityType === 'pr_merged' || activityType === 'pr_opened'
                ? 'github_pr'
                : 'github_review',
          sourceId: s.activityId,
          projectId: s.projectId,
          description: s.description,
          durationMinutes: s.durationMinutes,
          date: s.date,
          status: 'pending' as const,
          metadata: {
            repoName: activity?.repoName || '',
            repoFullName: activity?.repoFullName || '',
            commitSha: activity?.metadata.commitSha,
            commitMessage: activity?.metadata.commitMessage,
            prNumber: activity?.metadata.prNumber,
            prTitle: activity?.metadata.prTitle,
            additions: activity?.metadata.additions,
            deletions: activity?.metadata.deletions,
            reviewState: activity?.metadata.reviewState,
            url: activity?.url || '',
          },
          generatedAt: new Date().toISOString(),
        }
      }
    )

    // Cache the suggestions
    await setCachedSuggestions(organizationId, session.user.id, suggestions)

    return {
      suggestions,
      generatedAt: new Date().toISOString(),
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
      params.status
    )

    return { success: true }
  } catch (error) {
    console.error('Failed to update suggestion status:', error)
    return { success: false }
  }
}


