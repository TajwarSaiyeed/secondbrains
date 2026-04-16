import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, MessageSquare } from 'lucide-react'
import { SummarizeDialog } from './summarize-dialog'

interface DiscussionHeaderProps {
  board: {
    id: string
    title: string
    members: Array<{
      userId: string
      name: string | null
      role: string
    }>
  }
}

export function DiscussionHeader({ board }: DiscussionHeaderProps) {
  return (
    <div className="notebook-panel-header">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link href={`/dashboard/${board.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <MessageSquare className="text-primary h-4 w-4" />
          <div>
            <h1 className="text-sm leading-tight font-semibold">
              {board.title}
            </h1>
            <p className="text-muted-foreground text-xs leading-tight">
              Discussion
            </p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <SummarizeDialog boardId={board.id} />
        <div className="flex items-center gap-1.5 text-xs">
          <Users className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-muted-foreground">{board.members.length}</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          AI Enabled
        </Badge>
      </div>
    </div>
  )
}
