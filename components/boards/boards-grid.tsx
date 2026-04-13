'use client'

import { BoardCard } from '@/components/boards/board-card'
import { CreateBoardDialog } from '@/components/boards/create-board-dialog'
import { Brain } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useEffect, useState } from 'react'

export function BoardsGrid() {
  const boards = useQuery(api.boards.listBoards)
  const currentUser = useQuery(api.users.current)

  if (boards === undefined) {
    return (
      <div className="py-12 text-center">
        <div className="flex animate-pulse space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="bg-muted mx-auto h-4 w-3/4 rounded"></div>
            <div className="space-y-2">
              <div className="bg-muted h-4 rounded"></div>
              <div className="bg-muted mx-auto h-4 w-5/6 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (boards.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="bg-muted/30 mx-auto mb-4 w-fit rounded-full p-4">
          <Brain className="text-muted-foreground h-12 w-12" />
        </div>
        <h3 className="text-foreground mb-2 text-xl font-semibold">
          No boards yet
        </h3>
        <p className="text-muted-foreground mx-auto mb-6 max-w-md">
          Create your first study board to start collaborating and organizing
          your research materials.
        </p>
        <CreateBoardDialog />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <BoardCard
          key={board._id}
          board={board}
          currentUserId={currentUser?.userId || ''}
        />
      ))}
    </div>
  )
}
