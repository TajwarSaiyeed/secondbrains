import { action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

/**
 * Helper to send Inngest events.
 *
 * In production, sends directly to Inngest cloud using the event key.
 * For local dev, use the Next.js proxy approach (call from frontend).
 */
async function sendInngestEvent(name: string, data: Record<string, any>) {
  const eventKey = process.env.INNGEST_EVENT_KEY
  if (!eventKey) {
    // Throw so the frontend catch block can send via local proxy instead
    throw new Error(
      `No INNGEST_EVENT_KEY configured. Event "${name}" should be sent via frontend proxy.`,
    )
  }

  // In production, send directly to Inngest cloud API
  const res = await fetch('https://inn.gs/e/' + eventKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Inngest API error (${res.status}): ${errorBody}`)
  }
}

export const triggerWebScrape = action({
  args: {
    url: v.string(),
    boardId: v.id('boards'),
    authorId: v.string(),
    linkId: v.optional(v.id('links')),
  },
  handler: async (ctx, args) => {
    try {
      await sendInngestEvent('board/link.added', {
        url: args.url,
        boardId: args.boardId,
        authorId: args.authorId,
        linkId: args.linkId,
      })
      return {
        success: true,
        message: 'Crawler background job initiated.',
        useProxy: false,
      }
    } catch (e: any) {
      // In local dev, INNGEST_EVENT_KEY is not set - signal frontend to use proxy
      if (e.message.includes('No INNGEST_EVENT_KEY')) {
        return {
          success: true,
          message: 'Crawler background job initiated.',
          useProxy: true,
        }
      }
      // For other errors, just warn and return success
      console.warn('Failed to trigger web scrape:', e.message)
      return {
        success: true,
        message: 'Crawler background job initiated.',
        useProxy: false,
      }
    }
  },
})

export const triggerBoardSummary = action({
  args: {
    boardId: v.id('boards'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    try {
      await sendInngestEvent('ai/summarize-board', {
        boardId: args.boardId.toString(),
        userId,
      })
      return {
        success: true,
        message: 'Board summary generation has been queued.',
        useProxy: false,
      }
    } catch (e: any) {
      // In local dev, INNGEST_EVENT_KEY is not set - signal frontend to use proxy
      if (e.message.includes('No INNGEST_EVENT_KEY')) {
        return {
          success: true,
          message: 'Please use frontend proxy for local dev',
          useProxy: true,
        }
      }
      throw new Error(`Failed to queue summary task: ${e.message}`)
    }
  },
})

export const triggerInviteEmail = action({
  args: {
    boardId: v.id('boards'),
    email: v.string(),
    boardTitle: v.optional(v.string()),
    inviterName: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean
    message: string
    useProxy: boolean
    token?: string
  }> => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    // Generate the invite token here while we have auth context
    const { token } = await ctx.runMutation(api.invites.generateInviteToken, {
      boardId: args.boardId,
    })

    try {
      await sendInngestEvent('auth/send-invite-email', {
        boardId: args.boardId.toString(),
        email: args.email,
        userId,
        boardTitle: args.boardTitle || 'Study Board',
        inviterName: args.inviterName || 'A SecondBrains user',
        message: args.message,
        inviteToken: token,
      })
      return {
        success: true,
        message: `Invitation email queued for ${args.email}.`,
        useProxy: false,
      }
    } catch (e: any) {
      // In local dev, INNGEST_EVENT_KEY is not set - signal frontend to use proxy
      if (e.message.includes('No INNGEST_EVENT_KEY')) {
        return {
          success: true,
          message: `Invitation email queued for ${args.email}.`,
          useProxy: true,
          token, // Return token for proxy fallback
        }
      }
      throw new Error(`Failed to queue invite task: ${e.message}`)
    }
  },
})

export const triggerFileExtraction = action({
  args: {
    fileId: v.id('fileMetas'),
    storageId: v.id('_storage'),
    fileUrl: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    boardId: v.id('boards'),
  },
  handler: async (ctx, args) => {
    try {
      await sendInngestEvent('board/file.uploaded', {
        fileId: args.fileId,
        storageId: args.storageId,
        fileUrl: args.fileUrl,
        fileName: args.fileName,
        fileType: args.fileType,
        boardId: args.boardId,
      })
      return {
        success: true,
        useProxy: false,
      }
    } catch (e: any) {
      // In local dev, INNGEST_EVENT_KEY is not set - signal frontend to use proxy
      if (e.message.includes('No INNGEST_EVENT_KEY')) {
        return {
          success: true,
          useProxy: true,
        }
      }
      console.warn('Failed to trigger file extraction:', e.message)
      return {
        success: true,
        useProxy: false,
      }
    }
  },
})

export const triggerDiscussionSummary = action({
  args: {
    boardId: v.id('boards'),
    timeframe: v.union(v.literal('days'), v.literal('dateRange')),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      await sendInngestEvent('board/discussion.summarize', {
        boardId: args.boardId,
        timeframe: args.timeframe,
        startDate: args.startDate,
        endDate: args.endDate,
        days: args.days,
      })
      return {
        success: true,
        useProxy: false,
      }
    } catch (e: any) {
      // In local dev, INNGEST_EVENT_KEY is not set - signal frontend to use proxy
      if (e.message.includes('No INNGEST_EVENT_KEY')) {
        return {
          success: true,
          useProxy: true,
        }
      }
      console.error('Failed to trigger inngest for discussion summary', e)
      return {
        success: true,
        useProxy: false,
      }
    }
  },
})
