import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const sendMessage = mutation({
  args: {
    boardId: v.id('boards'),
    content: v.string(),
    authorName: v.string(),
    replyToId: v.optional(v.id('messages')),
    audioUrl: v.optional(v.string()),
    audioStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    const board = await ctx.db.get(args.boardId)
    if (!board) throw new Error('Board not found')

    const isOwner = board.ownerId === userId

    // Verify membership
    const membership = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .first()

    if (!isOwner && !membership)
      throw new Error('You are not a member of this board')

    let finalAudioUrl = args.audioUrl
    if (args.audioStorageId) {
      const url = await ctx.storage.getUrl(args.audioStorageId)
      if (url) finalAudioUrl = url
    }

    const messageId = await ctx.db.insert('messages', {
      boardId: args.boardId,
      content: args.content,
      authorId: userId,
      authorName: args.authorName,
      createdAt: Date.now(),
      replyToId: args.replyToId,
      audioUrl: finalAudioUrl,
      audioStorageId: args.audioStorageId,
    })

    return messageId
  },
})

/**
 * System mutation — used by Inngest AI jobs to post messages without user auth context.
 */
export const sendSystemMessage = mutation({
  args: {
    boardId: v.id('boards'),
    content: v.string(),
    authorName: v.string(),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId)
    if (!board) throw new Error('Board not found')

    const messageId = await ctx.db.insert('messages', {
      boardId: args.boardId,
      content: args.content,
      authorId: 'system',
      authorName: args.authorName,
      createdAt: Date.now(),
    })

    return messageId
  },
})

export const getMessages = query({
  args: {
    boardId: v.id('boards'),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let messages = []

    if (args.searchQuery) {
      messages = await ctx.db
        .query('messages')
        .withSearchIndex('search_content', (q) =>
          q.search('content', args.searchQuery!).eq('boardId', args.boardId),
        )
        .collect()
      // Need to manual sort the search results
      messages.sort((a, b) => a.createdAt - b.createdAt)
    } else {
      messages = await ctx.db
        .query('messages')
        .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
        .order('asc')
        .collect()
    }

    return Promise.all(
      messages.map(async (msg) => {
        let parentMessage = null
        if (msg.replyToId) {
          parentMessage = await ctx.db.get(msg.replyToId)
        }
        return {
          ...msg,
          parentMessage: parentMessage
            ? {
                content: parentMessage.content,
                authorName: parentMessage.authorName,
              }
            : undefined,
        }
      }),
    )
  },
})

export const markAsAnswer = mutation({
  args: {
    messageId: v.id('messages'),
    boardId: v.id('boards'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    const board = await ctx.db.get(args.boardId)
    if (!board) throw new Error('Board not found')

    // Only owner can mark as answer
    if (board.ownerId !== userId) {
      throw new Error('Only the board owner can mark messages as answers')
    }

    const message = await ctx.db.get(args.messageId)
    if (!message) throw new Error('Message not found')

    const existingAnswer = await ctx.db
      .query('answers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .first()

    if (existingAnswer) {
      // Replace existing answer
      await ctx.db.patch(existingAnswer._id, { messageId: args.messageId })
    } else {
      // Create new answer record
      await ctx.db.insert('answers', {
        boardId: args.boardId,
        messageId: args.messageId,
        markedById: userId,
        markedAt: Date.now(),
      })
    }

    return true
  },
})

export const unmarkAsAnswer = mutation({
  args: {
    messageId: v.id('messages'),
    boardId: v.id('boards'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    const board = await ctx.db.get(args.boardId)
    if (!board) throw new Error('Board not found')

    if (board.ownerId !== userId) {
      throw new Error('Only the board owner can unmark messages as answers')
    }

    const existingAnswer = await ctx.db
      .query('answers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .first()

    if (existingAnswer && existingAnswer.messageId === args.messageId) {
      await ctx.db.delete(existingAnswer._id)
    }

    return true
  },
})

export const deleteMessage = mutation({
  args: {
    messageId: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    const message = await ctx.db.get(args.messageId)
    if (!message) throw new Error('Message not found')

    let canDelete = message.authorId === userId

    if (!canDelete) {
      const board = await ctx.db.get(message.boardId)
      if (board && board.ownerId === userId) {
        canDelete = true
      }
    }

    if (!canDelete) {
      throw new Error('Unauthorized to delete this message')
    }

    await ctx.db.delete(args.messageId)
    return true
  },
})

export const searchMessages = query({
  args: {
    boardId: v.id('boards'),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchQuery.trim()) {
      return []
    }

    const messages = await ctx.db
      .query('messages')
      .withSearchIndex('search_content', (q) =>
        q.search('content', args.searchQuery).eq('boardId', args.boardId),
      )
      .take(50)

    return Promise.all(
      messages.map(async (msg) => {
        let parentMessage = null
        if (msg.replyToId) {
          parentMessage = await ctx.db.get(msg.replyToId)
        }
        return {
          ...msg,
          parentMessage: parentMessage
            ? {
                content: parentMessage.content,
                authorName: parentMessage.authorName,
              }
            : undefined,
        }
      }),
    )
  },
})

export const getMessagesForSummary = query({
  args: {
    boardId: v.id('boards'),
    timeframe: v.optional(v.union(v.literal('days'), v.literal('dateRange'))),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query('messages')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))

    const messages = await q.collect()

    if (args.timeframe === 'days') {
      const days = args.days || 2
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
      return messages.filter((m) => m._creationTime >= cutoff)
    }

    if (args.timeframe === 'dateRange' && args.startDate) {
      const start = new Date(args.startDate).getTime()
      const end = args.endDate ? new Date(args.endDate).getTime() : Date.now()
      return messages.filter(
        (m) => m._creationTime >= start && m._creationTime <= end,
      )
    }

    return messages.slice(-50) // Default to last 50 messages
  },
})
