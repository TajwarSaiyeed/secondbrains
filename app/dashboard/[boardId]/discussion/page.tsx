import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import type { DiscussionMessage } from '@/actions/discussions'
import { DiscussionHeader } from '@/components/discussions/discussion-header'
import { DiscussionMessages } from '@/components/discussions/discussion-messages'

type Params = Promise<{ boardId: string }>

export default async function DiscussionPage({ params }: { params: Params }) {
  const { boardId } = await params
  const user: any = await getCurrentUser()
  if (!user) redirect('/login')

  const board: any = null

  const messages: DiscussionMessage[] = []

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      <DiscussionHeader
        board={{
          id: boardId,
          title: board?.title || 'Discussion',
          members: board?.members || [],
        }}
      />
      <DiscussionMessages boardId={boardId} currentUserId={user?.id || ''} />
    </div>
  )
}
