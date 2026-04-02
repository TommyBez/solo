/**
 * AI Model Configuration for Time Capture Features
 *
 * Models selected based on Vercel AI Gateway pricing and capabilities.
 * Optimized for cost efficiency while maintaining quality.
 *
 * Pricing reference (per 1M tokens):
 * - alibaba/qwen3.5-flash: $0.10 in / $0.40 out (best cache: $0.001/M)
 * - xai/grok-4.1-fast-reasoning: $0.20 in / $0.50 out (2M context)
 * - google/gemini-3-flash: $0.50 in / $3.00 out (latest, 1M context)
 */

export const AI_MODELS = {
  /**
   * Description Enhancement
   * - High frequency, simple task (improve vague descriptions)
   * - Qwen 3.5 Flash: Best value with excellent caching support
   * - Alternative: google/gemini-2.5-flash-lite or openai/gpt-5-nano
   */
  descriptionEnhancement: 'alibaba/qwen3.5-flash',

  /**
   * Entry Suggestion from Calendar
   * - Moderate frequency, needs context understanding + reasoning
   * - Grok 4.1 Fast Reasoning: 2M context, fast, tool-use support
   * - Alternative: deepseek/deepseek-v3.2 or alibaba/qwen3.5-flash
   */
  entrySuggestion: 'xai/grok-4.1-fast-reasoning',

  /**
   * Gap Audit (Weekly Analysis)
   * - Low frequency (weekly), complex pattern analysis
   * - Gemini 3 Flash: Latest model, excellent reasoning, 1M context
   * - Alternative: anthropic/claude-haiku-4.5 for premium quality
   */
  gapAudit: 'google/gemini-3-flash',

  /**
   * Business Data Chat
   * - Conversational, multi-step tool calling
   * - Grok 4.1 Fast Reasoning: 2M context, tool-use support, fast
   * - Alternative: google/gemini-3-flash or anthropic/claude-haiku-4.5
   */
  chat: 'openai/gpt-5.4',
} as const

export type AIModelKey = keyof typeof AI_MODELS
