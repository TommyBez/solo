import type { GoogleCalendarEvent } from '@/lib/google-calendar/types'

interface DescriptionPromptParams {
  areaName: string
  currentDescription: string
  durationMinutes: number
  projectName: string
  recentDescriptions: string[]
}

export function buildDescriptionPrompt(
  params: DescriptionPromptParams,
): string {
  const recentEntriesText =
    params.recentDescriptions.length > 0
      ? params.recentDescriptions
          .slice(0, 5)
          .map((d) => `- ${d}`)
          .join('\n')
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

export function buildEntrySuggestionPrompt(
  params: EntrySuggestionPromptParams,
): string {
  const eventDuration = Math.round(
    (new Date(params.calendarEvent.endTime).getTime() -
      new Date(params.calendarEvent.startTime).getTime()) /
      60_000,
  )

  const projectsText = params.projects
    .map((p) => `- ID ${p.id}: ${p.name} (${p.areaName})`)
    .join('\n')

  const recentEntriesText =
    params.recentEntries.length > 0
      ? params.recentEntries
          .slice(0, 5)
          .map(
            (e) => `- ${e.projectName}: ${e.description || '(no description)'}`,
          )
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
  expectedHoursPerWeek: number
  projects: Array<{ id: number; name: string }>
  weekEntries: Array<{
    date: string
    projectName: string
    description: string | null
    durationMinutes: number
  }>
}

export function buildGapAuditPrompt(params: GapAuditPromptParams): string {
  const entriesText = params.weekEntries
    .map(
      (e) =>
        `- ${e.date}: ${e.projectName} (${e.durationMinutes}min) - "${e.description || '(blank)'}"`,
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

export function isDescriptionVague(
  description: string | null | undefined,
): boolean {
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
  clusters: Array<{
    activityCount: number
    clusterId: string
    date: string
    repoFullName: string
    repoName: string
    summaries: string[]
    timeWindowEnd: string
    timeWindowStart: string
  }>
  existingEntries: Array<{
    date: string
    projectId: number
    projectName: string
    description: string | null
    durationMinutes: number
  }>
  projects: Array<{ id: number; name: string; areaName: string }>
}

export function buildGitHubSuggestionPrompt(
  params: GitHubSuggestionPromptParams,
): string {
  const clustersText = params.clusters
    .map((cluster) => {
      const summaries = cluster.summaries
        .map((summary) => `    - ${summary}`)
        .join('\n')
      return `- Cluster ${cluster.clusterId}
  - Repo: ${cluster.repoName} (${cluster.repoFullName})
  - Date: ${cluster.date}
  - Time window: ${cluster.timeWindowStart} -> ${cluster.timeWindowEnd}
  - Activity count: ${cluster.activityCount}
  - Activity summaries:
${summaries}`
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
              `- ${e.date}: [Project ${e.projectId} - ${e.projectName}] ${e.description || '(no description)'} (${e.durationMinutes}min)`,
          )
          .join('\n')
      : '(no recent entries)'

  return `You are helping a freelancer find missing time entries by comparing grouped GitHub work against existing Solo entries.

GitHub activity clusters from the past 7 days:
${clustersText}

Available projects to match:
${projectsText}

Existing Solo time entries (use them as the tracked-work source of truth):
${existingEntriesText}

Return up to 5 suggestions for genuinely missing time entries.

Rules:
1. Only return suggestions with HIGH confidence.
2. If an existing Solo entry plausibly covers the work, skip the cluster.
3. Match each cluster to the most likely project using repo name, project names, and patterns from existing entries.
4. Generate a professional description (5-15 words) suitable for client reporting.
5. Estimate realistic duration based on the total cluster work, not per individual GitHub event.
6. In the reasoning, explain both:
   - why the project match is strong
   - why the work still appears untracked in Solo
7. Prefer fewer, stronger suggestions over weak guesses.
8. Return an empty array when there is no clear missing-entry signal.

Important:
- Do not return medium or low confidence suggestions.
- Do not output more than one suggestion for the same cluster.
- Treat existing Solo entries as already tracked tasks/work.
- Avoid generic wording like "worked on GitHub tasks".`
}

interface GitHubSuggestionResponseItem {
  clusterId: string
  confidence: 'high' | 'medium' | 'low'
  date: string
  description: string
  durationMinutes: number
  projectId: number
  reasoning: string
}

export type GitHubSuggestionResponse = GitHubSuggestionResponseItem[]
