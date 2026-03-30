import { type InferAgentUIMessage, ToolLoopAgent, stepCountIs } from 'ai'
import { createChatTools } from './tools'

export function createChatAgent(organizationId: string) {
  return new ToolLoopAgent({
    model: 'google/gemini-3-flash',
    instructions: `You are a helpful assistant for a freelance time tracking app called Solo.
You help users understand their time tracking data, projects, areas, and clients.
Use the available tools to query data before answering. Be concise and specific.
When showing data, always use tools rather than making up numbers.
If asked about a date range, use the getTimeEntries tool with startDate/endDate.
Prefer calling multiple tools if needed to give a complete answer.`,
    tools: createChatTools(organizationId),
    stopWhen: stepCountIs(8),
  })
}

type ChatAgent = ReturnType<typeof createChatAgent>
export type ChatAgentUIMessage = InferAgentUIMessage<ChatAgent>
