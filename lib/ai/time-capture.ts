'use server'

import { generateText, Output } from 'ai'
import { requireOrganization } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { aiSuggestionDismissals, timeEntries, projects, areas } from '@/lib/db/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import {
  descriptionEnhancementSchema,
  entrySuggestionSchema,
  type DescriptionEnhancement,
  type EntrySuggestion,
  type SuggestionType,
} from './schemas'
import { buildDescriptionPrompt, buildEntrySuggestionPrompt } from './prompts'
import { AI_MODELS } from './models'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/types'

// Enhance a vague or empty description
export async function enhanceDescription(params: {
  currentDescription: string
  projectId: number
  projectName: string
  areaName: string
  durationMinutes: number
}): Promise<DescriptionEnhancement | null> {
  try {
    await requireOrganization()

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

    // Get recent entries for context
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const recentEntries = await db.query.timeEntries.findMany({
      where: gte(timeEntries.startTime, weekAgo),
      orderBy: [desc(timeEntries.startTime)],
      limit: 10,
      with: {
        project: true,
      },
    })

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


