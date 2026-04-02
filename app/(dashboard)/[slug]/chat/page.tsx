import { ChatInterface } from '@/components/chat/chat-interface'
import { PageHeader } from '@/components/page-header'

export default function ChatPage() {
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
