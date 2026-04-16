'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { notFound, redirect, useParams } from 'next/navigation'
import Link from 'next/link'
import { StudioPanel } from '@/components/boards/studio-panel'
import {
  NoteSourceItem,
  LinkSourceItem,
  FileSourceItem,
} from '@/components/boards/source-item'
import { DataDetailsModal } from '@/components/boards/data-details-modal'
import { DiscussionHeader } from '@/components/discussions/discussion-header'
import { DiscussionMessages } from '@/components/discussions/discussion-messages'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Files, FileText, Link as LinkIcon, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-client'
import { useState } from 'react'

export default function DiscussionPage() {
  const params = useParams()
  const boardId = params.boardId as string
  const { data: session } = useAuth()
  const boardIdTyped =
    boardId as unknown as import('convex/_generated/dataModel').Id<'boards'>

  const currentUser = useQuery(api.users.current)
  const board = useQuery(api.boards.getBoardDetails, { boardId: boardIdTyped })
  const notes = useQuery(api.notes.getNotesByBoard, { boardId: boardIdTyped })
  const links = useQuery(api.links.getLinksByBoard, { boardId: boardIdTyped })
  const files = useQuery(api.files.getFilesByBoard, { boardId: boardIdTyped })
  const aiSummary = useQuery(api.ai.getAiSummary, { boardId: boardIdTyped })
  const members = useQuery(api.boards.getBoardMembersWithDetails, {
    boardId: boardIdTyped,
  })

  const [activeTab, setActiveTab] = useState('notes')

  if (!session && session !== undefined) {
    redirect('/login')
  }

  if (board === null) {
    return notFound()
  }

  // Loading state
  if (!board || !notes || !links || !files) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col">
        <Skeleton className="h-14 w-full border-b" />
        <div className="notebook-layout flex-1">
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
  const memberCount = members?.length || 0

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Header */}
      <DiscussionHeader
        board={{
          id: boardId,
          title: board.title,
          members: members || [],
        }}
      />

      <Separator />

      {/* Main 3-Column NotebookLM Layout */}
      <div className="notebook-layout flex-1">
        {/* ── Left Column: Sources & Members ── */}
        <div className="notebook-panel">
          <div className="notebook-panel-header">
            <div className="flex items-center gap-2">
              <Files className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-semibold">Sources</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {sourceCount}
            </Badge>
          </div>

          <div className="notebook-panel-body">
            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="notes" title="Notes">
                  <FileText className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger value="links" title="Links">
                  <LinkIcon className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger value="files" title="Files">
                  <Files className="h-3.5 w-3.5" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="mt-3 space-y-1">
                {notes.map((note: any) => (
                  <div key={note._id} className="group relative">
                    <NoteSourceItem note={note as any} onClick={() => {}} />
                    <div className="absolute top-1 right-1 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                      <DataDetailsModal
                        title={`Note by ${note.authorName}`}
                        type="note"
                        content={note.content}
                      />
                    </div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-muted-foreground py-4 text-center text-xs italic">
                    No notes in this board.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="links" className="mt-3 space-y-1">
                {links.map((link: any) => (
                  <div key={link._id} className="group relative">
                    <LinkSourceItem link={link as any} onClick={() => {}} />
                    <div className="absolute top-1 right-1 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                      <DataDetailsModal
                        title={link.title || 'Untitled Link'}
                        type="link"
                        content={link.url}
                        metadata={{ title: link.title, status: link.status }}
                      />
                    </div>
                  </div>
                ))}
                {links.length === 0 && (
                  <p className="text-muted-foreground py-4 text-center text-xs italic">
                    No links in this board.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="files" className="mt-3 space-y-1">
                {files.map((file: any) => (
                  <div key={file._id} className="group relative">
                    <FileSourceItem file={file as any} onClick={() => {}} />
                    <div className="absolute top-1 right-1 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                      <DataDetailsModal
                        title={file.name}
                        type="file"
                        content={
                          file.extractedContent || 'No content extracted yet.'
                        }
                        metadata={{ size: file.size, type: file.type }}
                      />
                    </div>
                  </div>
                ))}
                {files.length === 0 && (
                  <p className="text-muted-foreground py-4 text-center text-xs italic">
                    No files in this board.
                  </p>
                )}
              </TabsContent>
            </Tabs>

            <Separator className="my-3" />

            {/* Members */}
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-3.5 w-3.5" />
              <span className="text-xs font-medium">{memberCount} members</span>
            </div>
            <div className="mt-2 space-y-1">
              {(members || []).slice(0, 10).map((member: any) => (
                <div
                  key={member.userId || member._id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs"
                >
                  <div className="bg-primary/10 text-primary flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium">
                    {(member.name || 'U')[0].toUpperCase()}
                  </div>
                  <span className="truncate">{member.name || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Center Column: Discussion Chat ── */}
        <div className="notebook-panel">
          <div className="notebook-panel-header">
            <div className="flex items-center gap-2">
              <svg
                className="text-primary h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-sm font-semibold">Discussion</span>
            </div>
          </div>
          <div className="notebook-panel-body overflow-hidden p-0">
            <DiscussionMessages
              boardId={boardId}
              currentUserId={currentUser?.userId || ''}
            />
          </div>
        </div>

        {/* ── Right Column: Studio ── */}
        <div className="h-full overflow-hidden">
          <StudioPanel
            boardId={boardId}
            aiSummary={aiSummary ?? undefined}
            sourceCount={sourceCount}
          />
        </div>
      </div>
    </div>
  )
}
