'use client'

import { useChat } from '@ai-sdk/react'
import {
  JSONUIProvider,
  Renderer,
  useJsonRenderMessage,
} from '@json-render/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { Bot, Send, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { registry } from '@/lib/chat/registry'

const transport = new DefaultChatTransport({ api: '/api/chat' })

export function ChatInterface() {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status } = useChat({ transport })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (messages.length === 0 || !scrollRef.current) {
      return
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) {
      return
    }
    sendMessage({ text })
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border bg-background">
      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <EmptyChat />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && messages.at(-1)?.role === 'user' && (
              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="size-4 text-muted-foreground" />
                </div>
                <div className="animate-pulse text-muted-foreground text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <form className="border-t p-3" onSubmit={handleSubmit}>
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            className="max-h-[120px] min-h-[44px] resize-none"
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your time tracking data..."
            ref={textareaRef}
            rows={1}
            value={input}
          />
          <Button
            className="shrink-0"
            disabled={!input.trim() || isLoading}
            size="icon"
            type="submit"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'
  const { spec, text, hasSpec } = useJsonRenderMessage(message.parts)

  // For user messages, just show the text
  if (isUser) {
    const userText = message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')

    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[80%] rounded-lg bg-primary px-3 py-2 text-primary-foreground text-sm">
          {userText}
        </div>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <User className="size-4 text-primary" />
        </div>
      </div>
    )
  }

  // Assistant messages: text + optional json-render spec
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {text && (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {text}
          </div>
        )}
        {hasSpec && spec && (
          <JSONUIProvider registry={registry}>
            <Renderer loading={false} registry={registry} spec={spec} />
          </JSONUIProvider>
        )}
        {/* Render tool loading states for parts not captured by json-render */}
        {message.parts
          .filter((p) => p.type.startsWith('tool-'))
          .map((part) => {
            const toolPart = part as {
              type: string
              state: string
              toolCallId: string
            }
            if (
              toolPart.state === 'input-streaming' ||
              toolPart.state === 'input-available'
            ) {
              const toolName = toolPart.type.replace('tool-', '')
              return (
                <div
                  className="animate-pulse text-muted-foreground text-xs"
                  key={toolPart.toolCallId}
                >
                  Querying {toolName}...
                </div>
              )
            }
            return null
          })}
      </div>
    </div>
  )
}

function EmptyChat() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Bot className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 font-medium text-lg">Business Data Assistant</h3>
      <p className="mb-6 max-w-sm text-muted-foreground text-sm">
        Ask questions about your time entries, projects, clients, and areas.
      </p>
      <div className="grid gap-2 text-muted-foreground text-xs sm:grid-cols-2">
        <SuggestionChip text="How many hours did I track this week?" />
        <SuggestionChip text="Show me all my projects" />
        <SuggestionChip text="Which client has the most billable hours?" />
        <SuggestionChip text="Am I on track with my weekly goals?" />
      </div>
    </div>
  )
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <div className="rounded-md border px-3 py-2 text-left text-xs">{text}</div>
  )
}
