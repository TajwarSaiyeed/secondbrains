'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { MessageBubble } from '@/components/discussions/message-bubble'
import { MessageInput } from '@/components/discussions/message-input'
import { Input } from '@/components/ui/input'
import { Search, Bot, Link } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useAuth } from '@/lib/auth-client'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'

interface DiscussionMessagesProps {
  boardId: string
  currentUserId: string
}

export function DiscussionMessages({
  boardId,
  currentUserId,
}: DiscussionMessagesProps) {
  const { data: session } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [replyingTo, setReplyingTo] = useState<{
    id: string
    name: string
    content: string
  } | null>(null)

  const userDisplayName = session?.user?.name || 'Unknown User'
  const { typingUsers, setTyping } = useTypingIndicator(
    boardId,
    currentUserId,
    userDisplayName,
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch real-time messages from Convex
  const defaultMessages = useQuery(api.discussions.getMessages, {
    boardId: boardId as Id<'boards'>,
  })

  const searchResults = useQuery(
    api.discussions.searchMessages,
    debouncedSearchQuery.trim() !== ''
      ? { boardId: boardId as Id<'boards'>, searchQuery: debouncedSearchQuery }
      : 'skip',
  )

  const messages =
    debouncedSearchQuery.trim() !== '' ? searchResults : defaultMessages

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(scrollToBottom, 100)
    }
  }, [messages?.length, scrollToBottom])

  if (messages === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        Loading messages...
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden pt-16">
      <div className="border-b p-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search discussion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted/50 pl-9"
          />
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="bg-muted/30 mb-4 rounded-full p-4">
              <Bot className="text-muted-foreground h-12 w-12" />
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">
              Start the conversation
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Ask questions, share ideas, or get AI-powered insights about your
              board content.
            </p>
            <div className="text-muted-foreground flex flex-col gap-2 text-sm sm:flex-row">
              <span>💡 Try asking: &quot;Summarize the key points&quot;</span>
              <span>or &quot;What are the main themes?&quot;</span>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={
                  {
                    _id: message._id,
                    id: message._id,
                    content: message.content,
                    authorId: message.authorId,
                    authorName: message.authorName,
                    createdAt: message.createdAt.toString(),
                    timestamp: message.createdAt,
                    parentMessage: message.parentMessage,
                    audioUrl: message.audioUrl,
                    audioStorageId: message.audioStorageId,
                  } as any
                }
                boardId={boardId}
                currentUserId={currentUserId}
                onReply={(id, name, content) =>
                  setReplyingTo({ id, name, content })
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {typingUsers.length > 0 && (
        <div className="text-muted-foreground flex items-center gap-2 px-4 py-2 text-xs italic">
          <span className="flex gap-1">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce delay-75">.</span>
            <span className="animate-bounce delay-150">.</span>
          </span>
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'}{' '}
          typing
        </div>
      )}

      <MessageInput
        boardId={boardId}
        replyToId={replyingTo?.id}
        replyToName={replyingTo?.name}
        replyToContent={replyingTo?.content}
        onCancelReply={() => setReplyingTo(null)}
        setTyping={setTyping}
      />
    </div>
  )
}
