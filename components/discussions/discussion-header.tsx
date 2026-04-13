import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users } from 'lucide-react'
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
    <div className="border-border bg-background border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/${board.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-foreground text-xl font-semibold">
              {board.title}
            </h1>
            <p className="text-muted-foreground text-sm">Discussion</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SummarizeDialog boardId={board.id} />
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">
              {board.members.length} members
            </span>
            <Badge variant="secondary" className="ml-2">
              AI Enabled
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
