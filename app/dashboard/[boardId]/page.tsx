import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/auth";
import { getBoard } from "@/actions/boards";
import { AddNoteForm } from "@/components/boards/add-note-form";
import { AddLinkForm } from "@/components/boards/add-link-form";
import { NoteCard } from "@/components/boards/note-card";
import { LinkCard } from "@/components/boards/link-card";
import { AISummaryCard } from "@/components/boards/ai-summary-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brain, ArrowLeft, MessageSquare, Users, LogOut } from "lucide-react";
import { logoutUser } from "@/actions/auth";

import { AddFileForm } from "@/components/boards/add-file-form";
import { FileCard } from "@/components/boards/file-card";
import { InviteUsersDialog } from "@/components/boards/invite-users-dialog";

interface BoardPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

type Board = {
  _id: string;
  title: string;
  description: string;
  ownerId: string;
  members: Array<{ userId: string; name: string; email: string; role: string }>;
  notes: Array<{
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    updatedAt: string;
  }>;
  links: Array<{
    id: string;
    title: string;
    url: string;
    description: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    updatedAt: string;
  }>;
  files: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
  aiSummary?: {
    id: string;
    content: string;
    generatedAt: string;
    generatedBy: string;
  };
};

async function BoardContent({ boardId }: { boardId: string }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const board = (await getBoard(boardId)) as unknown as Board | null;
  if (!board) {
    notFound();
  }

  const isOwner = board.ownerId === user._id.toString();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">
                MindMesh
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2 bg-transparent"
            >
              <Link href={`/dashboard/${boardId}/discussion`}>
                <MessageSquare className="h-4 w-4" />
                Discussion
              </Link>
            </Button>
            <InviteUsersDialog boardTitle={board.title} boardId={boardId} />

            <ThemeToggle />
            <form action={logoutUser}>
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Board Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {board.title}
                </h1>
                {isOwner && <Badge variant="secondary">Owner</Badge>}
              </div>
              <p className="text-muted-foreground">{board.description}</p>
            </div>

            {/* AI Summary */}
            <AISummaryCard boardId={boardId} aiSummary={board.aiSummary} />

            {/* Notes Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  Notes
                </h2>
                <span className="text-sm text-muted-foreground">
                  {board.notes.length} notes
                </span>
              </div>

              <AddNoteForm boardId={boardId} />

              <div className="space-y-4">
                {board.notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    boardId={boardId}
                    currentUserId={user._id.toString()}
                  />
                ))}
                {board.notes.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">
                        No notes yet. Add your first note above!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Links Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  Links
                </h2>
                <span className="text-sm text-muted-foreground">
                  {board.links.length} links
                </span>
              </div>

              <AddLinkForm boardId={boardId} />

              <div className="space-y-4">
                {board.links.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    boardId={boardId}
                    currentUserId={user._id.toString()}
                  />
                ))}
                {board.links.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">
                        No links yet. Add your first link above!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Files Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  Files
                </h2>
                <span className="text-sm text-muted-foreground">
                  {board.files?.length || 0} files
                </span>
              </div>

              <AddFileForm boardId={boardId} />

              <div className="space-y-4">
                {board.files?.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    canDelete={file.uploadedBy === user._id.toString()}
                  />
                ))}
                {(!board.files || board.files.length === 0) && (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">
                        No files yet. Upload your first file above!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members ({board.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {board.members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                      <Badge
                        variant={
                          member.role === "owner" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Board Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Board Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Notes</span>
                  <span className="text-sm font-medium">
                    {board.notes.length}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Links</span>
                  <span className="text-sm font-medium">
                    {board.links.length}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Files</span>
                  <span className="text-sm font-medium">
                    {board.files?.length || 0}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Members</span>
                  <span className="text-sm font-medium">
                    {board.members.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function BoardPage(props: BoardPageProps) {
  const { boardId } = await props.params;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BoardContent boardId={boardId} />
    </Suspense>
  );
}
