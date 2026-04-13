'use server'

import { fetchAuthMutation } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

export type DiscussionMessage = {
  _id: string
  boardId: string
  userId: string
  content: string
  isAnswer: boolean
  timestamp: number
  authorName?: string
  type?: string
  createdAt?: string
  id?: string
  authorId?: string
}

export async function markAnswer(
  boardId: string,
  messageId: string,
): Promise<ActionResult<void>> {
  try {
    await fetchAuthMutation(api.discussions.markAsAnswer, {
      boardId: boardId as any,
      messageId: messageId as any,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function unmarkAnswer(
  boardId: string,
  messageId: string,
): Promise<ActionResult<void>> {
  try {
    await fetchAuthMutation(api.discussions.unmarkAsAnswer, {
      boardId: boardId as any,
      messageId: messageId as any,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function isMessageAnswered(
  boardId: string,
  messageId: string,
): Promise<ActionResult<boolean>> {
  try {
    // Left as true for now since it's a stub check, or could call a query
    return { success: true, data: false }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function deleteMessage(
  boardId: string,
  messageId: string,
): Promise<ActionResult<void>> {
  try {
    await fetchAuthMutation(api.discussions.deleteMessage, {
      messageId: messageId as any,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
