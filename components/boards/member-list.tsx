'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Crown, User } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MemberListProps {
  boardId: string
}

export function MemberList({ boardId }: MemberListProps) {
  const members = useQuery(api.boards.getBoardMembersWithDetails, {
    boardId: boardId as any,
  })

  if (!members) {
    return (
      <div className="flex -space-x-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-background bg-muted h-8 w-8 animate-pulse rounded-full border-2"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2 overflow-hidden">
        <TooltipProvider>
          {members.map((member) => (
            <Tooltip key={member._id}>
              <TooltipTrigger asChild>
                <Avatar className="border-background ring-border h-8 w-8 border-2 ring-1">
                  <AvatarImage src={member.imageUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {member.name
                      ? member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                      : '?'}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{member.name}</span>
                  {member.role === 'owner' ? (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  ) : (
                    <User className="text-muted-foreground h-3 w-3" />
                  )}
                </div>
                <p className="text-muted-foreground text-[10px]">
                  {member.email}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
      {members.length > 5 && (
        <Badge
          variant="secondary"
          className="h-6 rounded-full px-2 text-[10px]"
        >
          +{members.length - 5}
        </Badge>
      )}
    </div>
  )
}
