'use client'

import { BreadcrumbNav } from '@/components/breadcrumb-nav'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MemberList } from './member-list'
import { InviteUsersDialog } from './invite-users-dialog'
import { Trash2, MessageSquare } from 'lucide-react'

interface BoardHeaderProps {
  board: any
  isOwner: boolean
  isDeleting: boolean
  setIsDeleting: (val: boolean) => void
  deleteBoard: (args: { boardId: any }) => Promise<any>
  boardId: string
}

export function BoardHeader({
  board,
  isOwner,
  isDeleting,
  setIsDeleting,
  deleteBoard,
  boardId,
}: BoardHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex shrink-0 flex-col space-y-3">
      <BreadcrumbNav
        items={[
          { label: 'Boards', href: '/dashboard' },
          { label: board.title, isCurrent: true },
        ]}
      />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{board.title}</h1>
            <p className="text-muted-foreground text-sm">{board.description}</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1.5">
            <Link href={`/dashboard/${boardId}/discussion`}>
              <MessageSquare className="h-3.5 w-3.5" />
              Discussions
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <MemberList boardId={boardId} />
          <InviteUsersDialog boardId={boardId} />

          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the board and all its notes, links, and documents.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isDeleting}
                    onClick={async (e) => {
                      e.preventDefault()
                      setIsDeleting(true)
                      try {
                        await deleteBoard({ boardId: boardId as any })
                        router.push('/dashboard')
                      } catch (e) {
                        console.error(e)
                      } finally {
                        setIsDeleting(false)
                      }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Board'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  )
}
