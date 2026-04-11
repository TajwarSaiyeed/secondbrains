import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBoard } from "@/actions/boards";
import { getMessages, type DiscussionMessage } from "@/actions/discussions";
import { DiscussionHeader } from "@/components/discussions/discussion-header";
import { DiscussionMessages } from "@/components/discussions/discussion-messages";

type Params = Promise<{ boardId: string }>;

export default async function DiscussionPage({ params }: { params: Params }) {
  const { boardId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const board = await getBoard(boardId);
  if (!board) redirect("/dashboard");

  const messages = await getMessages(boardId);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <DiscussionHeader
        board={{ id: board.id, title: board.title, members: board.members }}
      />
      <DiscussionMessages
        boardId={board.id}
        currentUserId={user.id}
        initialMessages={messages as DiscussionMessage[]}
      />
    </div>
  );
}
