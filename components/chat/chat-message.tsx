import { isToolUIPart } from 'ai'
import { Bot, Loader2, User } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ChatAgentUIMessage } from '@/lib/ai/chat/agent'
import { AreasCard } from './tool-cards/areas-card'
import { ClientsCard } from './tool-cards/clients-card'
import { ProjectsCard } from './tool-cards/projects-card'
import { StatsCard } from './tool-cards/stats-card'
import { TimeEntriesCard } from './tool-cards/time-entries-card'

type MessagePart = ChatAgentUIMessage['parts'][number]

function renderBuiltInToolPart(
  part: MessagePart,
  key: string,
): ReactNode | null {
  switch (part.type) {
    case 'tool-getTimeEntries':
      return part.state === 'output-available' ? (
        <TimeEntriesCard entries={part.output.entries} key={key} />
      ) : (
        <ToolLoading key={key} name="Loading time entries" />
      )
    case 'tool-getProjects':
      return part.state === 'output-available' ? (
        <ProjectsCard key={key} projects={part.output.projects} />
      ) : (
        <ToolLoading key={key} name="Loading projects" />
      )
    case 'tool-getAreas':
      return part.state === 'output-available' ? (
        <AreasCard areas={part.output.areas} key={key} />
      ) : (
        <ToolLoading key={key} name="Loading areas" />
      )
    case 'tool-getClients':
      return part.state === 'output-available' ? (
        <ClientsCard clients={part.output.clients} key={key} />
      ) : (
        <ToolLoading key={key} name="Loading clients" />
      )
    case 'tool-getDashboardStats':
      return part.state === 'output-available' ? (
        <StatsCard key={key} stats={part.output} />
      ) : (
        <ToolLoading key={key} name="Loading stats" />
      )
    default:
      return null
  }
}

function renderMessagePart(
  part: MessagePart,
  key: string,
  isUser: boolean,
): ReactNode {
  if (part.type === 'text' && part.text.trim()) {
    return (
      <div
        className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
        key={key}
      >
        {part.text}
      </div>
    )
  }

  const builtIn = renderBuiltInToolPart(part, key)
  if (builtIn !== null) {
    return builtIn
  }

  if (isToolUIPart(part)) {
    if (part.state === 'output-available') {
      return (
        <div
          className="rounded-md border border-border bg-card p-2 text-muted-foreground text-xs"
          key={key}
        >
          Tool completed
        </div>
      )
    }
    return <ToolLoading key={key} name="Working" />
  }

  return null
}

export function ChatMessage({ message }: { message: ChatAgentUIMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
          <Bot className="size-4" />
        </div>
      )}
      <div
        className={`flex min-w-0 max-w-[85%] flex-col gap-2 ${isUser ? 'items-end' : ''}`}
      >
        {message.parts.map((part, i) =>
          renderMessagePart(part, `${message.id}-${i}`, isUser),
        )}
      </div>
      {isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-primary/10">
          <User className="size-4" />
        </div>
      )}
    </div>
  )
}

function ToolLoading({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-muted-foreground text-xs">
      <Loader2 className="size-3 animate-spin" />
      {name}...
    </div>
  )
}
