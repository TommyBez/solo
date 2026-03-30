'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUp, MessageSquare } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChatAgentUIMessage } from '@/lib/ai/chat/agent'
import { ChatMessage } from './chat-message'

const transport = new DefaultChatTransport({ api: '/api/chat' })

const SUGGESTIONS = [
  'What did I work on this week?',
  'Show my active projects',
  'How many hours did I bill last week?',
  'List my clients',
]

export function ChatPage() {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat<ChatAgentUIMessage>({
    transport,
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    sendMessage({ text })
    setInput('')
  }

  function handleSuggestion(text: string) {
    if (isLoading) return
    sendMessage({ text })
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted">
              <MessageSquare className="size-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">
                Ask about your data
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                I can look up your time entries, projects, areas, and clients.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                  onClick={() => handleSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border pt-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your data..."
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-ring/50 placeholder:text-muted-foreground focus:ring-2"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
    </div>
  )
}
