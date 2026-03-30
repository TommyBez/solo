import { isToolUIPart } from 'ai'
import { Loader2, User, Bot } from 'lucide-react'
import type { ChatAgentUIMessage } from '@/lib/ai/chat/agent'
import { AreasCard } from './tool-cards/areas-card'
import { ClientsCard } from './tool-cards/clients-card'
import { ProjectsCard } from './tool-cards/projects-card'
import { StatsCard } from './tool-cards/stats-card'
import { TimeEntriesCard } from './tool-cards/time-entries-card'

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
        {message.parts.map((part, i) => {
          const key = `${message.id}-${i}`

          if (part.type === 'text' && part.text.trim()) {
            return (
              <div
                key={key}
                className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {part.text}
              </div>
            )
          }

          if (part.type === 'tool-getTimeEntries') {
            if (part.state === 'output-available') {
              return (
                <TimeEntriesCard key={key} entries={part.output.entries} />
              )
            }
            return <ToolLoading key={key} name="Loading time entries" />
          }

          if (part.type === 'tool-getProjects') {
            if (part.state === 'output-available') {
              return (
                <ProjectsCard key={key} projects={part.output.projects} />
              )
            }
            return <ToolLoading key={key} name="Loading projects" />
          }

          if (part.type === 'tool-getAreas') {
            if (part.state === 'output-available') {
              return <AreasCard key={key} areas={part.output.areas} />
            }
            return <ToolLoading key={key} name="Loading areas" />
          }

          if (part.type === 'tool-getClients') {
            if (part.state === 'output-available') {
              return <ClientsCard key={key} clients={part.output.clients} />
            }
            return <ToolLoading key={key} name="Loading clients" />
          }

          if (part.type === 'tool-getDashboardStats') {
            if (part.state === 'output-available') {
              return <StatsCard key={key} stats={part.output} />
            }
            return <ToolLoading key={key} name="Loading stats" />
          }

          // Catch any other tool parts generically
          if (isToolUIPart(part)) {
            if (part.state === 'output-available') {
              return (
                <div
                  key={key}
                  className="rounded-md border border-border bg-card p-2 text-xs text-muted-foreground"
                >
                  Tool completed
                </div>
              )
            }
            return <ToolLoading key={key} name="Working" />
          }

          return null
        })}
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
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      <Loader2 className="size-3 animate-spin" />
      {name}...
    </div>
  )
}
