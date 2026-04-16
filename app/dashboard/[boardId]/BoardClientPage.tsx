'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { notFound, redirect, useRouter, useParams } from 'next/navigation'
import { BoardHeader } from '@/components/boards/BoardHeader'
import { SourcesPanel } from '@/components/boards/SourcesPanel'
import { BoardChat } from '@/components/boards/board-chat'
import { StudioPanel } from '@/components/boards/studio-panel'
import { Separator } from '@/components/ui/separator'
import { FileExtractionToast } from '@/components/notifications/file-extraction-toast'
import { Sparkles } from 'lucide-react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useAuth } from '@/lib/auth-client'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function BoardClientPage({
  boardId: boardIdProp,
}: {
  boardId: string
}) {
  const router = useRouter()
  const params = useParams()
  const boardId = boardIdProp || (params.boardId as string)
  const { data: session } = useAuth()
  const isAuthenticated = !!session

  const boardIdTyped =
    boardId as unknown as import('convex/_generated/dataModel').Id<'boards'>

  const currentUser = useQuery(api.users.current)
  const board = useQuery(api.boards.getBoardDetails, { boardId: boardIdTyped })
  const notes = useQuery(api.notes.getNotesByBoard, { boardId: boardIdTyped })
  const links = useQuery(api.links.getLinksByBoard, { boardId: boardIdTyped })
  const files = useQuery(api.files.getFilesByBoard, { boardId: boardIdTyped })
  const aiSummary = useQuery(api.ai.getAiSummary, { boardId: boardIdTyped })

  const deleteBoard = useMutation(api.boards.deleteBoard)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('notes')

  if (!isAuthenticated && session !== undefined) {
    redirect('/login')
  }

  const isOwner = board?.ownerId === currentUser?.userId

  if (board === null) {
    return notFound()
  }

  // Loading state
  if (!board || !notes || !links || !files) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-1/4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-1/4" />
        </div>
        <div className="notebook-layout">
          <Skeleton className="notebook-panel h-full" />
          <div className="notebook-panel">
            <div className="notebook-panel-body">
              <Skeleton className="h-full" />
            </div>
          </div>
          <Skeleton className="notebook-panel h-full" />
        </div>
      </div>
    )
  }

  const sourceCount = notes.length + links.length + files.length

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <BoardHeader
        board={board}
        isOwner={isOwner}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
        deleteBoard={deleteBoard}
        boardId={boardId}
      />

      <Separator className="shrink-0" />

      <FileExtractionToast boardId={boardId} />

      {/* Main 3-Column Content (NotebookLM Style) */}
      <div className="min-h-0 flex-1">
        <ResizablePanelGroup className="h-full">
          {/* Left Column: Sources (25%) */}
          <ResizablePanel minSize={20}>
            <SourcesPanel
              boardId={boardId}
              notes={notes}
              links={links}
              files={files}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sourceCount={sourceCount}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* ── Center Column: Chat ── */}
          <ResizablePanel minSize={30}>
            <div className="notebook-panel">
              <div className="notebook-panel-header">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary h-4 w-4" />
                  <span className="text-sm font-semibold">AI Chat</span>
                </div>
              </div>
              <div className="notebook-panel-body overflow-hidden p-0">
                <BoardChat boardId={boardId} />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* ── Right Column: Studio ── */}
          <ResizablePanel minSize={20}>
            <div className="h-full overflow-hidden">
              <StudioPanel
                boardId={boardId}
                aiSummary={aiSummary ?? undefined}
                sourceCount={sourceCount}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
