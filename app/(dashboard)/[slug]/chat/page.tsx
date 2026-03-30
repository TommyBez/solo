import { ChatPage } from '@/components/chat/chat-page'
import { PageHeader } from '@/components/page-header'

export default function ChatRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Ask questions about your time tracking data"
        title="Chat"
      />
      <ChatPage />
    </div>
  )
}
