"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageBubble } from "@/components/discussions/message-bubble";
import { MessageInput } from "@/components/discussions/message-input";
import { getMessages } from "@/actions/discussions";
import { Bot } from "lucide-react";

interface Message {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  type: "user" | "ai";
  createdAt: string;
}

interface MessageResponse {
  id?: string;
  _id: string;
  content: string;
  authorId: string;
  authorName: string;
  type: "user" | "ai";
  createdAt: string;
}

interface DiscussionMessagesProps {
  boardId: string;
  currentUserId: string;
  initialMessages: Message[];
}

export function DiscussionMessages({
  boardId,
  currentUserId,
  initialMessages,
}: DiscussionMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [messageCount, setMessageCount] = useState(initialMessages.length);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    let isActive = true;

    const pollMessages = async () => {
      if (!isActive) return;

      const now = Date.now();
      const timeSinceLastFetch = now - lastFetch;

      if (timeSinceLastFetch < 2000) return;

      try {
        const updatedMessages = await getMessages(boardId);
        const formattedMessages = updatedMessages.map(
          (msg: MessageResponse) => ({
            id: msg.id || msg._id,
            content: msg.content,
            authorId: msg.authorId,
            authorName: msg.authorName,
            type: msg.type,
            createdAt: msg.createdAt,
          })
        );

        if (isActive && formattedMessages.length !== messageCount) {
          const hadMessages = messages.length > 0;
          const isNewMessage = formattedMessages.length > messageCount;

          setMessages(formattedMessages);
          setMessageCount(formattedMessages.length);
          setLastFetch(now);

          if (hadMessages && isNewMessage) {
            setTimeout(scrollToBottom, 100);
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    const interval = setInterval(pollMessages, 2000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [boardId, messageCount, lastFetch, messages.length, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, scrollToBottom]);

  const handleNewMessage = () => {
    setTimeout(async () => {
      try {
        const updatedMessages = await getMessages(boardId);
        const formattedMessages = updatedMessages.map(
          (msg: MessageResponse) => ({
            id: msg.id || msg._id,
            content: msg.content,
            authorId: msg.authorId,
            authorName: msg.authorName,
            type: msg.type,
            createdAt: msg.createdAt,
          })
        );
        setMessages(formattedMessages);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error fetching messages after send:", error);
      }
    }, 500);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
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
                key={message.id}
                message={message}
                boardId={boardId}
                currentUserId={currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput boardId={boardId} onMessageSent={handleNewMessage} />
    </div>
  );
}
