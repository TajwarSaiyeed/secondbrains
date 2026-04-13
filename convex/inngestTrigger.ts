import { action } from './_generated/server'
import { v } from 'convex/values'
import { inngest } from '../inngest/client'

export const triggerWebScrape = action({
  args: {
    url: v.string(),
    boardId: v.id('boards'),
    authorId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await inngest.send({
      name: 'board/link.added',
      data: {
        url: args.url,
        boardId: args.boardId,
        authorId: args.authorId,
      },
    })

    return { success: true, message: 'Crawler background job initiated.' }
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

    await inngest.send({
      name: 'ai/summarize-board',
      data: {
        boardId: args.boardId.toString(),
        userId,
      },
    })

    return {
      success: true,
      message: 'Board summary generation has been queued.',
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
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    await inngest.send({
      name: 'auth/send-invite-email',
      data: {
        boardId: args.boardId.toString(),
        email: args.email,
        userId,
        boardTitle: args.boardTitle || 'Study Board',
        inviterName: args.inviterName || 'A SecondBrains user',
        message: args.message,
      },
    })

    return {
      success: true,
      message: `Invitation email queued for ${args.email}.`,
    }
  },
})
