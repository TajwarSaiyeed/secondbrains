'use server'

import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  status?: string
  message?: string
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult<void>> {
  try {
    return {
      success: false,
      error: 'Please use Better Auth client for password change.',
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function sendPasswordReset(
  email: string,
): Promise<ActionResult<void>> {
  try {
    return {
      success: false,
      error: 'Please use Better Auth client for password reset.',
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function sendPasswordResetEmail(
  email: string,
): Promise<ActionResult<void>> {
  return sendPasswordReset(email)
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ActionResult<void>> {
  try {
    // TODO: Implement password reset with token via Convex
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
