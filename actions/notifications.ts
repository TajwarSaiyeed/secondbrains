'use server'

import { fetchAuthMutation } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

export type NotificationDTO = {
  id: string
  _id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  data?: any
  createdAt: number
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<ActionResult<void>> {
  try {
    await fetchAuthMutation(api.notifications.markAsRead, {
      notificationId: notificationId as any,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function acceptBoardInvite(
  inviteToken: string,
): Promise<ActionResult<void>> {
  try {
    await fetchAuthMutation(api.boards.joinViaInviteToken, {
      token: inviteToken,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
