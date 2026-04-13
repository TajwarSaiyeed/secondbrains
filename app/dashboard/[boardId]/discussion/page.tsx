import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { DiscussionMessage } from "@/actions/discussions";
import { DiscussionHeader } from "@/components/discussions/discussion-header";
import { DiscussionMessages } from "@/components/discussions/discussion-messages";

type Params = Promise<{ boardId: string }>;

export default async function DiscussionPage({ params }: { params: Params }) {
  const { boardId } = await params;
  const user: any = await getCurrentUser();
  if (!user) redirect("/login");

  // TODO: Fetch board and messages from Convex server
  const board: any = null;

  const messages: DiscussionMessage[] = [];

  // After checks above, board is safe to access
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <DiscussionHeader
        board={{
          id: boardId,
          title: board?.title || "Discussion",
          members: board?.members || [],
        }}
      />
      <DiscussionMessages
        boardId={boardId}
        currentUserId={user?.id || ""}
        
      />
    </div>
  );
}
