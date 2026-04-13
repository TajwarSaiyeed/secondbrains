import { useEffect, useState } from 'react'
import usePresence from '@convex-dev/presence/react'
import { api } from '@/convex/_generated/api'
import { useMutation } from 'convex/react'

export function useTypingIndicator(
  boardId: string,
  userId: string,
  userName: string,
) {
  const presence = usePresence(api.presence, boardId, userId, 5000)
  const updateRoomUser = useMutation(api.presence.updateRoomUser)

  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    updateRoomUser({
      roomId: boardId,
      userId,
      data: { typing: isTyping, userName },
    })
  }, [isTyping, updateRoomUser, boardId, userId, userName])

  const typingUsers = (presence || [])
    .filter((p) => p.online && p.userId !== userId && (p.data as any)?.typing)
    .map((p) => (p.data as any)?.userName as string)
    .filter(Boolean)

  return { typingUsers, setTyping: setIsTyping }
}
