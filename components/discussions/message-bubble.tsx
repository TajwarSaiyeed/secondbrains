"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  Bot,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { Reply } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  deleteMessage,
  markAnswer,
  unmarkAnswer,
  isMessageAnswered,
} from "@/actions/discussions";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";

interface MessageBubbleProps {
  message: {
    id?: string;
    _id?: string;
    timestamp?: number;
    parentMessage?: { content: string; authorName: string } | null;
    audioUrl?: string;
    audioStorageId?: string;
    content: string;
    authorId: string;
    authorName: string;
    type?: "user" | "ai";
    createdAt?: string;
  };
  boardId: string;
  currentUserId: string;
  onReply?: (msgId: string, authorName: string, content: string) => void;
}

export function MessageBubble({
  message,
  boardId,
  currentUserId,
  onReply,
}: MessageBubbleProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const isOwnMessage = message.authorId === currentUserId;
  const isAI = message.type === "ai";
  const canDelete = isOwnMessage && !isAI;
  const [isAnswered, setIsAnswered] = useState(false);
  const [isTogglingAnswer, setIsTogglingAnswer] = useState(false);

  const isLongContent = message.content.length > 500;
  const shouldTruncate = isLongContent && !isExpanded;

  async function handleDelete() {
    if (!canDelete) return;
    setIsDeleting(true);
    await deleteMessage(boardId, message.id || message._id || "");
    setIsDeleting(false);
  }

  async function fetchAnswered() {
    try {
      const res = await isMessageAnswered(boardId, message.id || message._id || "");
      setIsAnswered(res.data || false);
    } catch (err) {
      console.error("Failed to check answer state", err);
    }
  }

  async function handleToggleAnswer() {
    setIsTogglingAnswer(true);
    try {
      if (isAnswered) {
        await unmarkAnswer(boardId, message.id || message._id || "");
        setIsAnswered(false);
      } else {
        await markAnswer(boardId, message.id || message._id || "");
        setIsAnswered(true);
      }
    } catch (err) {
      console.error("Failed to toggle answer", err);
    }
    setIsTogglingAnswer(false);
  }

  useEffect(() => {
    fetchAnswered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  }

  return (
    <div
      className={`flex gap-3 ${
        isOwnMessage && !isAI ? "flex-row-reverse" : ""
      }`}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback
          className={`text-xs ${
            isAI ? "bg-primary text-primary-foreground" : ""
          }`}
        >
          {isAI ? (
            <Bot className="h-4 w-4" />
          ) : (
            message.authorName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          )}
        </AvatarFallback>
      </Avatar>

      <div
        className={`flex-1 max-w-[70%] ${
          isOwnMessage && !isAI ? "flex flex-col items-end" : ""
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {message.authorName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.timestamp || message.createdAt || Date.now()), {
              addSuffix: true,
            })}
          </span>
          {/* Always show dropdown for copy functionality */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                {isCopied ? "Copied!" : "Copy"}
              </DropdownMenuItem>
                {onReply && (
                  <DropdownMenuItem onClick={() => onReply(message.id || message._id || "", message.authorName, message.content)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleToggleAnswer}
                disabled={isTogglingAnswer}
                className={isAnswered ? "text-success" : ""}
              >
                {isAnswered ? "Unmark as Answer" : "Mark as Answer"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            isAI
              ? "bg-primary/10 border border-primary/20"
              : isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
            {message.parentMessage && (
              <div
                className={`text-xs mb-2 p-2 rounded bg-background/20 border-l-2 ${
                  isOwnMessage ? "border-primary-foreground" : "border-primary"
                }`}
              >
                <div className="font-semibold mb-0.5">
                  {message.parentMessage.authorName}
                </div>
                <div className="truncate opacity-80">
                  {message.parentMessage.content}
                </div>
              </div>
            )}
            {message.audioUrl && (
              <div className="mb-2">
                <audio src={message.audioUrl} controls className="w-full max-w-[250px] h-10 flex" />
              </div>
            )}
          {isAI ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <SyntaxHighlighter
                        style={
                          oneDark as NonNullable<
                            SyntaxHighlighterProps["style"]
                          >
                        }
                        language={match[1]}
                        PreTag="div"
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code {...rest} className={className}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {shouldTruncate
                  ? message.content.substring(0, 500) + "..."
                  : message.content}
              </ReactMarkdown>
              {isLongContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-xs p-1 h-auto"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show More
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              {shouldTruncate
                ? message.content.substring(0, 500) + "..."
                : message.content}
              {isLongContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-xs p-1 h-auto"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show More
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
