import { notFound } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'
import { PageHeader } from '@/components/page-header'
import { getAiFeatureAvailability } from '@/lib/ai/access'

export default async function ChatPage() {
  const { allowed } = await getAiFeatureAvailability()

  if (!allowed) {
    notFound()
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      <PageHeader
        description="Ask questions about your time tracking data"
        title="Chat"
      />
      <ChatInterface />
    </div>
  )
}
