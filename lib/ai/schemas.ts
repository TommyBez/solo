import { z } from 'zod'

// Schema for description enhancement response
export const descriptionEnhancementSchema = z.object({
  enhancedDescription: z
    .string()
    .describe('Improved, specific description (5-20 words)'),
  reasoning: z
    .string()
    .describe('Brief explanation for the user (e.g., "Similar to recent entries")'),
})

export type DescriptionEnhancement = z.infer<typeof descriptionEnhancementSchema>

// Schema for entry suggestion response
export const entrySuggestionSchema = z.object({
  projectId: z.number().describe('ID of the suggested project'),
  description: z
    .string()
    .describe('Professional description for client reporting (5-15 words)'),
  durationMinutes: z.number().positive().describe('Suggested duration in minutes'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the suggestion'),
  reasoning: z
    .string()
    .describe('Evidence-based explanation for the user'),
})

export type EntrySuggestion = z.infer<typeof entrySuggestionSchema>

// Schema for gap audit response
export const gapAuditSchema = z.object({
  missingBlocks: z.array(
    z.object({
      date: z.string().describe('ISO date string'),
      description: z.string().describe('Description of the likely missing work'),
      likelyProjectId: z.number().nullable().describe('Suggested project ID if known'),
      likelyDurationMinutes: z.number().positive().describe('Estimated duration in minutes'),
    })
  ),
  vagueDescriptions: z.array(
    z.object({
      entryId: z.number().describe('ID of the entry with vague description'),
      currentDescription: z.string().describe('The current vague description'),
      suggestedImprovement: z.string().describe('Improved description suggestion'),
    })
  ),
})

export type GapAudit = z.infer<typeof gapAuditSchema>

// Type for suggestion status
export type SuggestionStatus = 'default' | 'loading' | 'error' | 'accepting'

// Type for suggestion types
export type SuggestionType = 'missing_entry' | 'description_enhancement' | 'gap_audit'

// Type for evidence icons
export type EvidenceIcon = 'calendar' | 'history' | 'timer' | 'pattern'
