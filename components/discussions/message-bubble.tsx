"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, Bot } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { deleteMessage } from "@/actions/discussions"

interface MessageBubbleProps {
  message: {
    id: string
    content: string
    authorId: string
    authorName: string
    type: "user" | "ai"
    createdAt: string
  }
  boardId: string
  currentUserId: string
}

export function MessageBubble({ message, boardId, currentUserId }: MessageBubbleProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isOwnMessage = message.authorId === currentUserId
  const isAI = message.type === "ai"
  const canDelete = isOwnMessage && !isAI

  async function handleDelete() {
    if (!canDelete) return

    setIsDeleting(true)
    await deleteMessage(boardId, message.id)
    setIsDeleting(false)
  }

  return (
    <div className={`flex gap-3 ${isOwnMessage && !isAI ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={`text-xs ${isAI ? "bg-primary text-primary-foreground" : ""}`}>
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

      <div className={`flex-1 max-w-[70%] ${isOwnMessage && !isAI ? "flex flex-col items-end" : ""}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">{message.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div
          className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
            isAI
              ? "bg-primary/10 border border-primary/20"
              : isOwnMessage
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}
