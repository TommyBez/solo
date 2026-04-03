'use client'

import { useChat } from '@ai-sdk/react'
import {
  JSONUIProvider,
  Renderer,
  useJsonRenderMessage,
} from '@json-render/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import {
  ArrowDownIcon,
  Bot,
  CornerDownLeftIcon,
  Sparkles,
  SquareIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Shimmer } from '@/components/ai-elements/shimmer'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import {
  Tool,
  ToolContent,
  ToolHeader,
  type ToolState,
} from '@/components/ai-elements/tool'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { registry } from '@/lib/chat/registry'

const transport = new DefaultChatTransport({ api: '/api/chat' })

const ING_SUFFIX_RE = /ing\b/

const TOOL_LABELS: Record<string, string> = {
  queryTimeEntries: 'Querying time entries',
  getProjectStats: 'Loading project stats',
  getClientSummary: 'Loading client summary',
  getAreaBreakdown: 'Loading area breakdown',
  getAggregatedStats: 'Aggregating stats',
}

export function ChatInterface() {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const { messages, sendMessage, status, stop } = useChat({ transport })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll when new content arrives (only if user is at bottom)
  useEffect(() => {
    if (messages.length === 0 || !scrollRef.current || !isAtBottom) {
      return
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isAtBottom])

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }
    const threshold = 40
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold)
  }, [])

  function scrollToBottom() {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) {
      return
    }
    sendMessage({ text })
    setInput('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  function handleSuggestionClick(suggestion: string) {
    sendMessage({ text: suggestion })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border bg-background">
      {/* Messages area */}
      <div
        className="relative flex-1 overflow-y-auto p-4"
        onScroll={handleScroll}
        ref={scrollRef}
      >
        {messages.length === 0 ? (
          <EmptyChat onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {status === 'submitted' && messages.at(-1)?.role === 'user' && (
              <ThinkingMessage />
            )}
            <div className="min-h-[24px] shrink-0" />
          </div>
        )}

        {/* Scroll to bottom button */}
        {!isAtBottom && messages.length > 0 && (
          <button
            aria-label="Scroll to bottom"
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full border border-border/50 bg-card/90 px-3 py-1.5 shadow-sm backdrop-blur-sm transition-all hover:bg-card"
            onClick={scrollToBottom}
            type="button"
          >
            <ArrowDownIcon className="size-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Suggestions bar - shown during conversation when not loading */}
      {messages.length > 0 && !isLoading && (
        <div className="border-t px-3 py-2">
          <div className="mx-auto max-w-3xl">
            <Suggestions>
              <Suggestion
                onClick={handleSuggestionClick}
                suggestion="How many hours this week?"
              />
              <Suggestion
                onClick={handleSuggestionClick}
                suggestion="Show my projects"
              />
              <Suggestion
                onClick={handleSuggestionClick}
                suggestion="Am I on track with goals?"
              />
            </Suggestions>
          </div>
        </div>
      )}

      {/* Input area */}
      <form className="border-t p-3" onSubmit={handleSubmit}>
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            className="field-sizing-content max-h-[160px] min-h-[44px] resize-none"
            disabled={status === 'submitted'}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your time tracking data..."
            ref={textareaRef}
            rows={1}
            value={input}
          />
          {isLoading ? (
            <Button
              className="shrink-0"
              onClick={() => stop()}
              size="icon"
              type="button"
              variant="outline"
            >
              <SquareIcon className="size-4" />
            </Button>
          ) : (
            <Button
              className="shrink-0"
              disabled={!input.trim()}
              size="icon"
              type="submit"
            >
              <CornerDownLeftIcon className="size-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

function ThinkingMessage() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
        <Sparkles className="size-3.5" />
      </div>
      <div className="flex h-[calc(13px*1.65)] items-center text-sm">
        <Shimmer className="font-medium" duration={1.5}>
          Thinking...
        </Shimmer>
      </div>
    </div>
  )
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'
  const { spec, text, hasSpec } = useJsonRenderMessage(message.parts)

  if (isUser) {
    const userText = message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')

    return (
      <div className="flex flex-col items-end gap-2">
        <div className="max-w-[min(80%,56ch)] overflow-hidden break-words rounded-2xl rounded-br-lg border border-border/30 bg-gradient-to-br from-secondary to-muted px-3.5 py-2 text-sm shadow-sm">
          {userText}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
        <Sparkles className="size-3.5" />
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
        {/* Tool call states rendered as collapsible AI Elements */}
        {message.parts
          .filter((p) => p.type.startsWith('tool-'))
          .map((part) => {
            const toolPart = part as {
              type: string
              state: string
              toolCallId: string
            }
            const toolName = toolPart.type.replace('tool-', '')
            const toolLabel = TOOL_LABELS[toolName] ?? `Running ${toolName}`

            if (
              toolPart.state === 'input-streaming' ||
              toolPart.state === 'input-available'
            ) {
              return (
                <Tool key={toolPart.toolCallId}>
                  <ToolHeader
                    state={toolPart.state as ToolState}
                    title={toolLabel}
                  />
                </Tool>
              )
            }

            if (toolPart.state === 'output-available') {
              return (
                <Tool key={toolPart.toolCallId}>
                  <ToolHeader
                    state="output-available"
                    title={toolLabel
                      .replace(ING_SUFFIX_RE, 'ed')
                      .replace('Loading', 'Loaded')
                      .replace('Querying', 'Queried')
                      .replace('Aggregating', 'Aggregated')}
                  />
                  <ToolContent>
                    <p className="text-muted-foreground">
                      Data fetched successfully
                    </p>
                  </ToolContent>
                </Tool>
              )
            }

            if (toolPart.state === 'output-error') {
              return (
                <Tool key={toolPart.toolCallId}>
                  <ToolHeader
                    state="output-error"
                    title={`${toolLabel} failed`}
                  />
                </Tool>
              )
            }

            return null
          })}
      </div>
    </div>
  )
}

function EmptyChat({
  onSuggestionClick,
}: {
  onSuggestionClick: (suggestion: string) => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Bot className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 font-medium text-lg">Business Data Assistant</h3>
      <p className="mb-6 max-w-sm text-muted-foreground text-sm">
        Ask questions about your time entries, projects, clients, and areas.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Suggestion
          className="h-auto whitespace-normal rounded-lg px-3 py-2 text-left text-xs"
          onClick={onSuggestionClick}
          suggestion="How many hours did I track this week?"
          variant="outline"
        />
        <Suggestion
          className="h-auto whitespace-normal rounded-lg px-3 py-2 text-left text-xs"
          onClick={onSuggestionClick}
          suggestion="Show me all my projects"
          variant="outline"
        />
        <Suggestion
          className="h-auto whitespace-normal rounded-lg px-3 py-2 text-left text-xs"
          onClick={onSuggestionClick}
          suggestion="Which client has the most billable hours?"
          variant="outline"
        />
        <Suggestion
          className="h-auto whitespace-normal rounded-lg px-3 py-2 text-left text-xs"
          onClick={onSuggestionClick}
          suggestion="Am I on track with my weekly goals?"
          variant="outline"
        />
      </div>
    </div>
  )
}
