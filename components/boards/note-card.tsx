"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { deleteNote } from "@/actions/board-content";

interface NoteCardProps {
  note: {
    _id?: string;
    id?: string;
    content: string;
    authorId: string;
    authorName: string;
    _creationTime?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  boardId: string;
  currentUserId: string;
}

export function NoteCard({ note, boardId, currentUserId }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = note.authorId === currentUserId;
  const noteId = note._id || note.id || "";

  async function handleDelete() {
    if (!canDelete) return;

    setIsDeleting(true);
    await deleteNote(boardId, noteId);
    setIsDeleting(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {note.authorName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{note.authorName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(
                  new Date(note.createdAt || note._creationTime || Date.now()),
                  {
                    addSuffix: true,
                  },
                )}
              </p>
            </div>
          </div>
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
      </CardContent>
    </Card>
  );
}
