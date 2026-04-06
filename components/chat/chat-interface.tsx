'use client'

import { useChat } from '@ai-sdk/react'
import {
  JSONUIProvider,
  Renderer,
  useJsonRenderMessage,
} from '@json-render/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { Bot, CopyIcon, PlusIcon, RefreshCcwIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { Button } from '@/components/ui/button'
import { registry } from '@/lib/chat/registry'

const transport = new DefaultChatTransport({ api: '/api/chat' })

const SUGGESTION_PROMPTS = [
  'How many hours did I track this week?',
  'Show me all my projects',
  'Which client has the most billable hours?',
  'Am I on track with my weekly goals?',
] as const

export function ChatInterface() {
  const [chatSessionKey, setChatSessionKey] = useState(0)

  const handleStartNewChat = useCallback(() => {
    setChatSessionKey((currentKey) => currentKey + 1)
  }, [])

  return (
    <ChatSession key={chatSessionKey} onStartNewChat={handleStartNewChat} />
  )
}

function ChatSession({ onStartNewChat }: { onStartNewChat: () => void }) {
  const [input, setInput] = useState('')
  const { messages, sendMessage, status, stop, error, clearError, regenerate } =
    useChat({ transport })

  const isLoading = status === 'streaming' || status === 'submitted'
  const hasDraft = input.trim().length > 0
  const showNewChatButton =
    messages.length > 0 || hasDraft || !!error || isLoading

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'assistant') {
        return messages[i]?.id
      }
    }
    return undefined
  }, [messages])

  const handlePromptSubmit = useCallback(
    (message: PromptInputMessage) => {
      const text = message.text.trim()
      if (!text || isLoading) {
        return
      }
      sendMessage({ text })
      setInput('')
    },
    [isLoading, sendMessage],
  )

  const handleSuggestion = useCallback(
    (text: string) => {
      if (isLoading) {
        return
      }
      sendMessage({ text })
      setInput('')
    },
    [isLoading, sendMessage],
  )

  const handleNewChat = useCallback(() => {
    stop()
    clearError()
    onStartNewChat()
  }, [clearError, onStartNewChat, stop])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background">
      {showNewChatButton ? (
        <div className="border-b px-3 py-2">
          <div className="mx-auto flex max-w-3xl justify-end">
            <Button
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleNewChat}
              size="sm"
              type="button"
              variant="ghost"
            >
              <PlusIcon className="size-4" />
              New chat
            </Button>
          </div>
        </div>
      ) : null}
      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto max-w-3xl">
          {messages.length === 0 ? (
            <>
              <ConversationEmptyState
                description="Ask questions about your time entries, projects, clients, and areas."
                icon={<Bot className="size-12 text-muted-foreground" />}
                title="Business Data Assistant"
              />
              <Suggestions className="pb-2">
                {SUGGESTION_PROMPTS.map((text) => (
                  <Suggestion
                    key={text}
                    onClick={handleSuggestion}
                    suggestion={text}
                  />
                ))}
              </Suggestions>
            </>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  isLatestAssistant={message.id === lastAssistantMessageId}
                  isStreamingText={
                    message.role === 'assistant' &&
                    message.id === messages.at(-1)?.id &&
                    status === 'streaming'
                  }
                  key={message.id}
                  message={message}
                  onRegenerate={() => regenerate()}
                />
              ))}
              {isLoading && messages.at(-1)?.role === 'user' && (
                <Message from="assistant">
                  <MessageContent>
                    <p className="animate-pulse text-muted-foreground text-sm">
                      Thinking…
                    </p>
                  </MessageContent>
                </Message>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error && (
        <div
          className="border-destructive/30 border-t bg-destructive/5 px-4 py-2 text-destructive text-sm"
          role="alert"
        >
          <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
            <p className="min-w-0">{error.message}</p>
            <Button
              className="shrink-0"
              onClick={() => clearError()}
              size="sm"
              type="button"
              variant="outline"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="border-t p-3">
        <PromptInput
          className="relative mx-auto w-full max-w-3xl border-0 bg-transparent p-0 shadow-none"
          onSubmit={handlePromptSubmit}
        >
          <PromptInputTextarea
            className="max-h-[120px] min-h-[52px] pr-12"
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your time tracking data…"
            value={input}
          />
          <PromptInputSubmit
            className="absolute right-1 bottom-2"
            disabled={!(input.trim() || isLoading)}
            onStop={stop}
            status={status}
          />
        </PromptInput>
        <p className="mx-auto mt-2 max-w-3xl text-center text-muted-foreground text-xs">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  )
}

function ChatMessage({
  message,
  isLatestAssistant,
  isStreamingText,
  onRegenerate,
}: {
  message: UIMessage
  isLatestAssistant: boolean
  isStreamingText: boolean
  onRegenerate: () => void
}) {
  const isUser = message.role === 'user'
  const { spec, text, hasSpec } = useJsonRenderMessage(message.parts)

  if (isUser) {
    const userText = message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')

    return (
      <Message from="user">
        <MessageContent>
          <p className="whitespace-pre-wrap">{userText}</p>
        </MessageContent>
      </Message>
    )
  }

  const copyText = text?.trim() ?? ''

  return (
    <div className="flex w-full flex-col gap-2">
      <Message from="assistant">
        <MessageContent>
          {text ? (
            <MessageResponse isAnimating={isStreamingText}>
              {text}
            </MessageResponse>
          ) : null}
          {hasSpec && spec ? (
            <JSONUIProvider registry={registry}>
              <Renderer loading={false} registry={registry} spec={spec} />
            </JSONUIProvider>
          ) : null}
        </MessageContent>
      </Message>
      {isLatestAssistant ? (
        <MessageActions className="pl-0">
          {copyText ? (
            <MessageAction
              label="Copy"
              onClick={() => navigator.clipboard.writeText(copyText)}
              size="icon-sm"
              tooltip="Copy text"
              variant="ghost"
            >
              <CopyIcon className="size-3.5" />
            </MessageAction>
          ) : null}
          <MessageAction
            label="Retry"
            onClick={onRegenerate}
            size="icon-sm"
            tooltip="Regenerate response"
            variant="ghost"
          >
            <RefreshCcwIcon className="size-3.5" />
          </MessageAction>
        </MessageActions>
      ) : null}
    </div>
  )
}
