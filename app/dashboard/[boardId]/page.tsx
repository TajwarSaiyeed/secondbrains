import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getBoard, type BoardDTO } from "@/actions/boards";
import { AddNoteForm } from "../../../components/boards/add-note-form";
import { AddLinkForm } from "../../../components/boards/add-link-form";
import { AddFileForm } from "../../../components/boards/add-file-form";
import { NoteCard } from "../../../components/boards/note-card";
import { LinkCard } from "../../../components/boards/link-card";
import { FileCard } from "../../../components/boards/file-card";
import { AISummaryCard } from "../../../components/boards/ai-summary-card";
import { InviteUsersDialog } from "../../../components/boards/invite-users-dialog";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import AnswerContent from "@/components/boards/answer-content";
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
import { deleteBoard } from "@/actions/boards";

type Params = Promise<{
  boardId: string;
}>;

const BoardPage = async ({ params }: { params: Params }) => {
  const { boardId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const board = await getBoard(boardId);
  if (!board) return notFound();

  const canDeleteFiles = board.ownerId === user.id;
  const isOwner = canDeleteFiles;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{board.title}</h1>
          <p className="text-muted-foreground">{board.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="default" size="sm">
            <Link href={`/dashboard/${board.id}/discussion`}>Discussion</Link>
          </Button>
          <InviteUsersDialog boardId={board.id} boardTitle={board.title} />
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
                  <form
                    action={async () => {
                      "use server";
                      await deleteBoard(board.id);
                    }}
                  >
                    <AlertDialogAction asChild>
                      <Button type="submit" variant="destructive">
                        Confirm Delete
                      </Button>
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Top Section: AI Summary + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AISummaryCard boardId={board.id} aiSummary={board.aiSummary} />
        </div>

        {/* Sidebar - Members and Stats */}
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
                  <div key={member.userId} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {(member.name || member.email || "U")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.name || member.email || "Unknown"}
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

      {/* Bottom Section: Notes, Links, Files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes Section */}
        <div className="space-y-4 lg:col-span-2 order-2 lg:order-1">
          <h2 className="text-lg font-semibold">Notes</h2>
          <AddNoteForm boardId={board.id} />
          <div className="space-y-3">
            {board.notes.map((n: BoardDTO["notes"][number]) => (
              <NoteCard
                key={n.id}
                note={{
                  id: n.id,
                  content: n.content,
                  authorId: n.authorId,
                  authorName: n.authorName || "",
                  createdAt: n.createdAt,
                  updatedAt: n.updatedAt,
                }}
                boardId={board.id}
                currentUserId={user.id}
              />
            ))}
            {board.notes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
          </div>
          <h2 className="text-lg font-semibold mt-6">Answers</h2>
          <div className="space-y-3">
            {(board.answers || []).map((a) => (
              <Card key={a.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Answer</p>
                      <div className="mb-2">
                        <AnswerContent content={a.messageContent} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Marked by: {a.markedByName || "Unknown"}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <form
                        action={async () => {
                          "use server";
                          const { unmarkAnswer } = await import(
                            "@/actions/discussions"
                          );
                          await unmarkAnswer(board.id, a.messageId);
                        }}
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                        >
                          Remove
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(board.answers || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No answers yet.</p>
            )}
          </div>
        </div>

        {/* Links and Files Section */}
        <div className="space-y-4 order-1 lg:order-2">
          <h2 className="text-lg font-semibold">Links</h2>
          <AddLinkForm boardId={board.id} />
          <div className="space-y-3">
            {board.links.map((l: BoardDTO["links"][number]) => (
              <LinkCard
                key={l.id}
                link={{
                  id: l.id,
                  url: l.url,
                  title: l.title,
                  description: l.description || "",
                  authorId: l.authorId,
                  authorName: l.authorName || "",
                  createdAt: l.createdAt,
                  updatedAt: l.updatedAt,
                }}
                boardId={board.id}
                currentUserId={user.id}
              />
            ))}
            {board.links.length === 0 && (
              <p className="text-sm text-muted-foreground">No links yet.</p>
            )}
          </div>

          <h2 className="text-lg font-semibold mt-6">Files</h2>
          <AddFileForm boardId={board.id} />
          <div className="space-y-3">
            {board.files.map((f: BoardDTO["files"][number]) => (
              <FileCard
                boardId={board.id}
                key={f.id}
                file={{
                  id: f.id,
                  name: f.name,
                  size: f.size,
                  type: f.type,
                  uploadedBy: f.uploadedBy || "",
                  uploadedAt: f.uploadedAt,
                }}
                canDelete={canDeleteFiles}
              />
            ))}
            {board.files.length === 0 && (
              <p className="text-sm text-muted-foreground">No files yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardPage;
