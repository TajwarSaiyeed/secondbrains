'use client'

import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, User, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

type Message = {
  role: 'user' | 'model'
  content: string
  sources?: { id: string; title: string; url: string | null; type: string }[]
}

export function BoardChat({ boardId }: { boardId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content:
        "Hello! I'm integrated with this board's knowledge base. Ask me anything and I'll find the answers for you using the notes, links, and scraped content saved here.",
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [expandedSources, setExpandedSources] = useState<number | null>(null)

  const sendMessage = useAction(api.ai.chatWithBoard)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return

    const userMessage = input.trim()
    setInput('')

    const updatedMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ]
    setMessages(updatedMessages)
    setIsTyping(true)

    try {
      const history = updatedMessages
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }))

      const response = await sendMessage({
        boardId: boardId as Id<'boards'>,
        message: userMessage,
        history,
      })

      setMessages([
        ...updatedMessages,
        {
          role: 'model',
          content: response.text,
          sources: response.sources,
        },
      ])
    } catch (error) {
      console.error('Chat Failed:', error)
      setMessages([
        ...updatedMessages,
        {
          role: 'model',
          content:
            'Sorry, I encountered an error connecting to the AI or retrieving knowledge. Please try again.',
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <Card className="border-primary/20 flex h-150 flex-col shadow-lg">
      <CardHeader className="bg-muted/30 border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-full p-2">
            <Bot className="text-primary h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Board AI Assistant</CardTitle>
            <CardDescription className="text-xs">
              Hybrid Search & cRAG
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        <ScrollArea className="h-full w-full pr-4">
          <div className="space-y-4 pb-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  msg.role === 'user' ? 'flex-row-reverse' : '',
                )}
              >
                <div
                  className={cn(
                    'shrink-0 rounded-full p-2',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                  )}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted/50 space-y-3 rounded-tl-sm border',
                  )}
                >
                  <div className="prose prose-sm max-w-none text-current">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Render Sources if available */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="border-border/50 mt-3 border-t pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSources(
                            expandedSources === index ? null : index,
                          )
                        }
                        className="text-muted-foreground hover:text-foreground flex items-center text-xs transition-colors"
                      >
                        {expandedSources === index ? (
                          <ChevronUp className="mr-1 h-3 w-3" />
                        ) : (
                          <ChevronDown className="mr-1 h-3 w-3" />
                        )}
                        {msg.sources.length} knowledge sources cited
                      </button>

                      {expandedSources === index && (
                        <div className="mt-2 space-y-2">
                          {msg.sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                'bg-background/50 hover:bg-muted flex items-center justify-between rounded border p-2 text-xs transition-colors',
                                !src.url &&
                                  'pointer-events-none cursor-default',
                              )}
                            >
                              <span className="truncate pr-2 font-medium">
                                {src.title}
                              </span>
                              <Badge
                                variant="secondary"
                                className="shrink-0 text-[10px] capitalize"
                              >
                                {src.type}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="bg-muted shrink-0 rounded-full p-2">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted/50 flex items-center gap-1 rounded-2xl rounded-tl-sm border px-4 py-3 text-sm">
                  <span className="bg-foreground/50 h-1.5 w-1.5 animate-bounce rounded-full" />
                  <span className="bg-foreground/50 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0.2s]" />
                  <span className="bg-foreground/50 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSend}
          className="mt-auto flex items-center gap-2 pt-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your board..."
            disabled={isTyping}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
