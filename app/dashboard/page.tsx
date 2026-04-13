import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth-server'
import { Input } from '@/components/ui/input'
import { CreateBoardDialog } from '@/components/boards/create-board-dialog'
import { BoardsGrid } from '@/components/boards/boards-grid'
import Loading from './loading'

async function DashboardContent() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login?from=/dashboard')
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold">
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
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardContent />
    </Suspense>
  )
}
