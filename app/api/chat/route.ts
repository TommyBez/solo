import { createAgentUIStreamResponse } from 'ai'
import { createChatAgent } from '@/lib/ai/chat/agent'
import { requireOrganization } from '@/lib/auth/session'

export async function POST(request: Request) {
  const { organizationId } = await requireOrganization()
  const { messages } = await request.json()
  const agent = createChatAgent(organizationId)
  return createAgentUIStreamResponse({ agent, uiMessages: messages })
}
