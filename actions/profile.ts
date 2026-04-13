'use server'

import { fetchAuthMutation } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

export async function updateProfile(data: {
  name?: string
  email?: string
  image?: string
  phone?: string
  whatsapp?: string
  telegram?: string
}): Promise<ActionResult<void>> {
  try {
    await fetchAuthMutation(api.users.updateProfile, {
      name: data.name,
      phone: data.phone,
      whatsapp: data.whatsapp,
      telegram: data.telegram,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function getCurrentUser(): Promise<any> {
  const { getCurrentUser: getAuthUser } = await import('@/lib/auth')
  return getAuthUser()
}

export async function getUser(): Promise<any> {
  return getCurrentUser()
}
