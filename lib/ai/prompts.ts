import type { GitHubActivity } from '@/lib/github/types'
import type { GoogleCalendarEvent } from '@/lib/google-calendar/types'

interface DescriptionPromptParams {
  currentDescription: string
  projectName: string
  areaName: string
  durationMinutes: number
  recentDescriptions: string[]
}

export function buildDescriptionPrompt(params: DescriptionPromptParams): string {
  const recentEntriesText =
    params.recentDescriptions.length > 0
      ? params.recentDescriptions.slice(0, 5).map((d) => `- ${d}`).join('\n')
      : '(no recent entries)'

  return `You are helping a freelancer improve their time entry description.

Project: ${params.projectName}
Area: ${params.areaName}
Duration: ${params.durationMinutes} minutes
Current description: "${params.currentDescription || '(blank)'}"

Recent entries for this project:
${recentEntriesText}

Write a brief, professional description that:
1. Is specific enough to be useful in a weekly client summary
2. Uses 5-15 words
3. Describes likely work without inventing specific deliverables
4. Avoids generic phrases like "worked on" or "various tasks"

Also provide a brief reasoning line (e.g., "Similar to recent entries" or "Based on project context").`
}

interface EntrySuggestionPromptParams {
  calendarEvent: GoogleCalendarEvent
  projects: Array<{ id: number; name: string; areaName: string }>
  recentEntries: Array<{ projectName: string; description: string | null }>
}

export function buildEntrySuggestionPrompt(params: EntrySuggestionPromptParams): string {
  const eventDuration = Math.round(
    (new Date(params.calendarEvent.endTime).getTime() -
      new Date(params.calendarEvent.startTime).getTime()) /
      60000
  )

  const projectsText = params.projects
    .map((p) => `- ID ${p.id}: ${p.name} (${p.areaName})`)
    .join('\n')

  const recentEntriesText =
    params.recentEntries.length > 0
      ? params.recentEntries
          .slice(0, 5)
          .map((e) => `- ${e.projectName}: ${e.description || '(no description)'}`)
          .join('\n')
      : '(none)'

  return `You are helping a freelancer log time from a calendar event.

Calendar event:
- Title: ${params.calendarEvent.title}
- Duration: ${eventDuration} minutes
- Description: ${params.calendarEvent.description || '(none)'}

Available projects:
${projectsText}

Recent time entries this week:
${recentEntriesText}

Suggest:
1. The most likely project ID for this event
2. A professional description (5-15 words) suitable for client reporting
3. Duration in minutes (use the event duration unless there's reason to adjust)
4. Confidence level: "high" if clear match, "medium" if reasonable guess, "low" if uncertain
5. Brief reasoning explaining your suggestion

If you cannot confidently match to a project, use the first project and set confidence to "low".`
}

interface GapAuditPromptParams {
  weekEntries: Array<{
    date: string
    projectName: string
    description: string | null
    durationMinutes: number
  }>
  expectedHoursPerWeek: number
  projects: Array<{ id: number; name: string }>
}

export function buildGapAuditPrompt(params: GapAuditPromptParams): string {
  const entriesText = params.weekEntries
    .map(
      (e) =>
        `- ${e.date}: ${e.projectName} (${e.durationMinutes}min) - "${e.description || '(blank)'}"`
    )
    .join('\n')

  const projectsText = params.projects
    .map((p) => `- ID ${p.id}: ${p.name}`)
    .join('\n')

  return `You are helping a freelancer audit their weekly time entries before creating a summary.

Expected hours this week: ${params.expectedHoursPerWeek}

Time entries this week:
${entriesText || '(no entries)'}

Available projects:
${projectsText}

Identify:
1. Missing time blocks - days or periods with unusually low tracking
2. Vague descriptions - entries that are too short or generic for client reporting

For missing blocks, suggest:
- The date (ISO format)
- A brief description of likely missing work
- The most likely project ID (or null if unknown)
- Estimated duration in minutes

For vague descriptions, suggest:
- The entry ID
- The current description
- An improved description

Focus on actionable suggestions. Don't flag minor issues.`
}

// Patterns that indicate a vague/generic description
const VAGUE_PATTERNS = [
  /^work$/i,
  /^working$/i,
  /^stuff$/i,
  /^things$/i,
  /^meeting$/i,
  /^call$/i,
  /^misc$/i,
  /^various$/i,
  /^tasks$/i,
  /^dev$/i,
  /^development$/i,
  /^coding$/i,
]

export function isDescriptionVague(description: string | null | undefined): boolean {
  if (!description || description.trim().length === 0) {
    return true
  }

  const trimmed = description.trim()

  // Too short
  if (trimmed.length < 10) {
    return true
  }

  // Matches vague patterns
  if (VAGUE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return true
  }

  return false
}

interface GitHubSuggestionPromptParams {
  activities: GitHubActivity[]
  projects: Array<{ id: number; name: string; areaName: string }>
  existingEntries: Array<{
    date: string
    description: string | null
    durationMinutes: number
  }>
}

export function buildGitHubSuggestionPrompt(
  params: GitHubSuggestionPromptParams
): string {
  const activitiesText = params.activities
    .map((a) => {
      const typeLabel =
        a.type === 'commit'
          ? 'Commit'
          : a.type === 'pr_merged'
            ? 'Merged PR'
            : a.type === 'pr_opened'
              ? 'Opened PR'
              : 'Code Review'
      return `- [${typeLabel}] ${a.description} in ${a.repoName} at ${a.timestamp}`
    })
    .join('\n')

  const projectsText = params.projects
    .map((p) => `- ID ${p.id}: ${p.name} (${p.areaName})`)
    .join('\n')

  const existingEntriesText =
    params.existingEntries.length > 0
      ? params.existingEntries
          .slice(0, 10)
          .map(
            (e) =>
              `- ${e.date}: ${e.description || '(no description)'} (${e.durationMinutes}min)`
          )
          .join('\n')
      : '(no recent entries)'

  return `You are helping a freelancer log time based on their GitHub activity.

GitHub Activity (commits, PRs, reviews from the past 7 days):
${activitiesText}

Available projects to match:
${projectsText}

Already logged time entries (to avoid duplicates):
${existingEntriesText}

For each GitHub activity that appears to NOT be logged yet:
1. Match it to the most likely project based on repository name similarity to project names
2. Generate a professional description (5-15 words) suitable for client reporting
3. Estimate duration based on activity type:
   - Commits: 30-60 minutes (adjust based on commit message complexity)
   - Merged PRs: 60-120 minutes (larger if many additions/deletions mentioned)
   - Opened PRs: 30-60 minutes
   - Code reviews: 15-30 minutes
4. Set confidence: "high" if repo name clearly matches a project, "medium" if reasonable match, "low" if guessing
5. Provide brief reasoning explaining why this activity appears untracked

Group related commits from the same repo on the same day into a single suggestion.
Skip activities that clearly match existing time entries.
Return an empty array if all activities appear to already be logged.`
}

interface GitHubSuggestionResponseItem {
  activityId: string
  projectId: number
  description: string
  durationMinutes: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  date: string
}

export type GitHubSuggestionResponse = GitHubSuggestionResponseItem[]
