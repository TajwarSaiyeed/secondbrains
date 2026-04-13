"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { MessageBubble } from "@/components/discussions/message-bubble";
import { MessageInput } from "@/components/discussions/message-input";
import { Input } from "@/components/ui/input";
import { Search, Bot, Link } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-client";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

interface DiscussionMessagesProps {
  boardId: string;
  currentUserId: string;
}

export function DiscussionMessages({
  boardId,
  currentUserId,
}: DiscussionMessagesProps) {
  const { data: session } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string; content: string } | null>(null);

  const userDisplayName = session?.user?.name || "Unknown User";
  const { typingUsers, setTyping } = useTypingIndicator(boardId, currentUserId, userDisplayName);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch real-time messages from Convex
  const defaultMessages = useQuery(api.discussions.getMessages, {
    boardId: boardId as Id<"boards">,
  });

  const searchResults = useQuery(
    api.discussions.searchMessages,
    debouncedSearchQuery.trim() !== ""
      ? { boardId: boardId as Id<"boards">, searchQuery: debouncedSearchQuery }
      : "skip"
  );

  const messages = debouncedSearchQuery.trim() !== "" ? searchResults : defaultMessages;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages?.length, scrollToBottom]);

  if (messages === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        Loading messages...
      </div>
    );
  }

    return (
      <div className="flex-1 overflow-hidden flex flex-col pt-[64px]">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search discussion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-muted/30 rounded-full mb-4">
              <Bot className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Start the conversation
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Ask questions, share ideas, or get AI-powered insights about your
              board content.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
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
                  onReply={(id, name, content) => setReplyingTo({ id, name, content })}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-muted-foreground italic flex items-center gap-2">
          <span className="flex gap-1">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce delay-75">.</span>
            <span className="animate-bounce delay-150">.</span>
          </span>
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
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
  );
}
