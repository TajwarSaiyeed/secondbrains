import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { getBoards } from "@/actions/boards";
import { getUnreadNotificationCount } from "@/actions/notifications";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { BoardsGrid } from "@/components/boards/boards-grid";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Search } from "lucide-react";
import Loading from "./loading";

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const boards = await getBoards();
  const unreadCount = await getUnreadNotificationCount();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with polling */}
      <DashboardHeader userName={user.name} initialUnreadCount={unreadCount} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search your boards..." className="pl-10" />
        </div>

        {/* Boards Grid with polling */}
        <BoardsGrid
          initialBoards={boards}
          currentUserId={user._id.toString()}
        />
      </main>
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
