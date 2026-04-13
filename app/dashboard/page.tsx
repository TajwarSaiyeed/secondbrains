import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-server";
import { Input } from "@/components/ui/input";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
// Note: BoardsGrid should be converted to 'use client' and use `useQuery(api.boards.listBoards)`
import { BoardsGrid } from "@/components/boards/boards-grid";
import Loading from "./loading";

async function DashboardContent() {
  // Server-side auth check (double protection via middleware + page level)
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login?from=/dashboard");
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Your Study Boards
          </h1>
          <p className="text-muted-foreground mt-1">
            Collaborate, learn, and discover with AI-powered insights
          </p>
        </div>
        <CreateBoardDialog />
      </div>

      <div className="relative mb-8">
        <Input placeholder="Search your boards..." />
      </div>

      {/* BoardsGrid is now responsible for handling its own real-time Convex state */}
      <BoardsGrid />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardContent />
    </Suspense>
  );
}
