import { pipeJsonRender } from '@json-render/core'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'
import { AI_MODELS } from '@/lib/ai/models'
import { requireOrganization } from '@/lib/auth/session'
import { catalog } from '@/lib/chat/catalog'
import { buildChatSystemPrompt } from '@/lib/chat/system-prompt'
import { createChatTools } from '@/lib/chat/tools'

export async function POST(req: Request) {
  const { organizationId } = await requireOrganization()
  const { messages }: { messages: UIMessage[] } = await req.json()

  const tools = createChatTools(organizationId)
  const systemPrompt = `${buildChatSystemPrompt()}\n\n${catalog.prompt({ mode: 'inline' })}`

  const result = streamText({
    model: AI_MODELS.chat,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  })

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.merge(pipeJsonRender(result.toUIMessageStream()))
    },
  })

  return createUIMessageStreamResponse({ stream })
}
