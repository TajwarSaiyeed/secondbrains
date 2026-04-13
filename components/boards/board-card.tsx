import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Clock, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface BoardCardProps {
  board: {
    _id?: string
    id?: string
    title: string
    description?: string | null
    members?: Array<{
      userId: string
      name?: string | null
      email?: string | null
      role: string
    }>
    notes?: Array<{ _id?: string; id?: string }>
    links?: Array<{ _id?: string; id?: string }>
    files?: Array<{ _id?: string; id?: string }>
    _creationTime?: number
    updatedAt?: string
    ownerId: string
  }
  currentUserId: string
}

export function BoardCard({ board, currentUserId }: BoardCardProps) {
  const isOwner = board.ownerId === currentUserId
  const memberCount = board.members?.length || 0
  const contentCount =
    (board.notes?.length || 0) +
    (board.links?.length || 0) +
    (board.files?.length || 0)

  return (
    <Link href={`/dashboard/${board._id || board.id}`}>
      <Card className="border-border h-full cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="line-clamp-2 text-lg">
                {board.title}
              </CardTitle>
              {board.description && (
                <CardDescription className="mt-2 line-clamp-3">
                  {board.description}
                </CardDescription>
              )}
            </div>
            {isOwner && (
              <Badge variant="secondary" className="ml-2">
                Owner
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </span>
              <div className="ml-2 flex -space-x-1">
                {(board.members || []).slice(0, 3).map((member) => (
                  <Avatar
                    key={member.userId}
                    className="border-background h-6 w-6 border-2"
                  >
                    <AvatarFallback className="text-xs">
                      {(member.name || member.email || '?')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {memberCount > 3 && (
                  <div className="bg-muted border-background flex h-6 w-6 items-center justify-center rounded-full border-2">
                    <span className="text-muted-foreground text-xs">
                      +{memberCount - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                {contentCount} item{contentCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                Updated{' '}
                {formatDistanceToNow(
                  new Date(
                    board.updatedAt || board._creationTime || Date.now(),
                  ),
                  {
                    addSuffix: true,
                  },
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
