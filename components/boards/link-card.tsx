'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { deleteLink } from '@/actions/board-content'

interface LinkCardProps {
  link: {
    id: string
    url: string
    title: string
    description: string
    authorId: string
    authorName: string
    createdAt: string
    updatedAt: string
  }
  boardId: string
  currentUserId: string
}

export function LinkCard({ link, boardId, currentUserId }: LinkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const canDelete = link.authorId === currentUserId

  async function handleDelete() {
    if (!canDelete) return

    setIsDeleting(true)
    await deleteLink(boardId, link.id)
    setIsDeleting(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {link.authorName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{link.authorName}</p>
              <p className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(link.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary flex items-center gap-2 font-medium hover:underline"
          >
            {link.title}
            <ExternalLink className="h-3 w-3" />
          </a>
          {link.description && (
            <p className="text-muted-foreground text-sm">{link.description}</p>
          )}
          <p className="text-muted-foreground text-xs break-all">{link.url}</p>
        </div>
      </CardContent>
    </Card>
  )
}
