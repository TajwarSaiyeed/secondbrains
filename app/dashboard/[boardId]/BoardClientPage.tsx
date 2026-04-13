"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AddNoteForm } from "@/components/boards/add-note-form";
import { AddLinkForm } from "@/components/boards/add-link-form";
import { AddFileForm } from "@/components/boards/add-file-form";
import { NoteCard } from "@/components/boards/note-card";
import { LinkCard } from "@/components/boards/link-card";
import { FileCard } from "@/components/boards/file-card";
import { AISummaryCard } from "@/components/boards/ai-summary-card";
import { BoardChat } from "@/components/boards/board-chat";
import { InviteUsersDialog } from "@/components/boards/invite-users-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTrigger,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-client";
import { useState } from "react";

export default function BoardClientPage({ boardId }: { boardId: string }) {
  const currentUser = useQuery(api.users.current);
  const { data: session } = useAuth();
  const isAuthenticated = !!session;
  const board = useQuery(api.boards.getBoardDetails, {
    boardId:
      boardId as unknown as import("convex/_generated/dataModel").Id<"boards">,
  });
  const notes = useQuery(api.notes.getNotesByBoard, {
    boardId:
      boardId as unknown as import("convex/_generated/dataModel").Id<"boards">,
  });
  const deleteBoard = useMutation(api.boards.deleteBoard);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isAuthenticated) {
    redirect("/login");
  }

  if (board === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading board...
      </div>
    );
  }

  if (board === null) {
    return notFound();
  }

  const isOwner = currentUser && board.ownerId === currentUser.userId;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{board.title}</h1>
          <p className="text-muted-foreground">{board.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="default" size="sm">
            <Link href={`/dashboard/${boardId}/discussion`}>Discussion</Link>
          </Button>
          <InviteUsersDialog boardId={boardId} boardTitle={board.title} />
          {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Board
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this board?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All notes, links, files, and
                  discussions on this board will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await deleteBoard({
                        boardId:
                          boardId as unknown as import("convex/_generated/dataModel").Id<"boards">,
                      });
                      redirect("/dashboard");
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col gap-4">
            <AddNoteForm boardId={boardId} />
            <AddLinkForm boardId={boardId} />
            <AddFileForm boardId={boardId} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notes?.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                boardId={boardId}
                currentUserId={session?.user?.id || ""}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <AISummaryCard boardId={boardId} />
          <BoardChat boardId={boardId} />
          {/* Other board widgets like member list can go here */}
        </div>
      </div>
    </div>
  );
}
