import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getBoard } from "@/actions/boards";
import { getMessages } from "@/actions/discussions";
import { DiscussionMessages } from "@/components/discussions/discussion-messages";
import { DiscussionHeader } from "@/components/discussions/discussion-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brain, LogOut } from "lucide-react";
import { logoutUser } from "@/actions/auth";
import Loading from "./loading";

interface DiscussionPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

async function DiscussionContent({ boardId }: { boardId: string }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const board = await getBoard(boardId);
  if (!board) {
    notFound();
  }
  const b = board as {
    _id: string;
    title?: string;
    members?: Array<{ userId: string; name: string; role: string }>;
  };

  const messages = await getMessages(boardId);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">MindMesh</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.name}
            </span>
            <ThemeToggle />
            <form action={logoutUser}>
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Discussion Header */}
      <DiscussionHeader
        board={{
          _id: b._id,
          title: b.title ?? "",
          members: (b.members || []).map(
            (m: { userId: string; name: string; role: string }) => ({
              userId: m.userId,
              name: m.name,
              role: m.role,
            })
          ),
        }}
      />

      {/* Messages Area with polling */}
      <DiscussionMessages
        boardId={boardId}
        currentUserId={user._id.toString()}
        initialMessages={messages.map(
          (msg: {
            id?: string;
            _id: string;
            content: string;
            authorId: string;
            authorName: string;
            type: "user" | "ai";
            createdAt: string;
          }) => ({
            id: msg.id || msg._id,
            content: msg.content,
            authorId: msg.authorId,
            authorName: msg.authorName,
            type: msg.type,
            createdAt: msg.createdAt,
          })
        )}
      />
    </div>
  );
}

export default async function DiscussionPage(props: DiscussionPageProps) {
  const { boardId } = await props.params;
  return (
    <Suspense fallback={<Loading />}>
      <DiscussionContent boardId={boardId} />
    </Suspense>
  );
}
