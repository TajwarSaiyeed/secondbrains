'use server'

import { fetchAuthMutation, fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

export async function deleteNote(
  boardId: string,
  noteId: string,
): Promise<ActionResult<void>> {
  try {
    await fetchAuthMutation(api.notes.deleteNote, { noteId: noteId as any })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function deleteLink(
  boardId: string,
  linkId: string,
): Promise<ActionResult<void>> {
  try {
    await fetchAuthMutation(api.links.deleteLink, { linkId: linkId as any })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function deleteFile(
  boardId: string,
  fileId: string,
): Promise<ActionResult<void>> {
  try {
    await fetchAuthMutation(api.files.deleteFile, { fileId: fileId as any })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function downloadFile(
  fileId: string,
): Promise<
  ActionResult<{ base64: string; contentType: string; filename: string }>
> {
  try {
    const file = await fetchAuthQuery(api.files.getFileDetails, {
      fileId: fileId as any,
    })

    if (!file || !file.url) throw new Error('File not found')

    const response = await fetch(file.url)
    if (!response.ok) throw new Error('Failed to fetch file')

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return {
      success: true,
      data: {
        base64,
        contentType: file.type,
        filename: file.name,
      },
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
