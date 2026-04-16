import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

/**
 * Generate an invite link for a board
 * Only the board owner can generate invites
 */
export const generateInviteToken = mutation({
  args: {
    boardId: v.id('boards'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    // Verify board exists and user is owner
    const board = await ctx.db.get(args.boardId)
    if (!board) throw new Error('Board not found')
    if (board.ownerId !== userId) {
      throw new Error('Only board owner can generate invite links')
    }

    // Generate a unique token (UUID-like format)
    const token = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    await ctx.db.patch(args.boardId, {
      inviteToken: token,
    })

    return {
      token,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${token}`,
    }
  },
})

/**
 * Internal version of generateInviteToken for background jobs
 */
export const generateInviteTokenInternal = mutation({
  args: {
    boardId: v.id('boards'),
  },
  handler: async (ctx, args) => {
    // No auth check since it's internal
    const board = await ctx.db.get(args.boardId)
    if (!board) throw new Error('Board not found')

    const token = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    await ctx.db.patch(args.boardId, {
      inviteToken: token,
    })

    return { token }
  },
})

/**
 * Get board info by invite token (for accepting invites)
 */
export const getBoardByInviteToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query('boards')
      .filter((q) => q.eq(q.field('inviteToken'), args.token))
      .first()

    if (!board) return null

    return {
      boardId: board._id,
      title: board.title,
      description: board.description,
      ownerName: '', // Will be fetched separately if needed
    }
  },
})

/**
 * Accept an invite and join the board
 */
export const acceptInvite = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    // Find board by invite token
    const board = await ctx.db
      .query('boards')
      .filter((q) => q.eq(q.field('inviteToken'), args.token))
      .first()

    if (!board) throw new Error('Invalid invite token')

    const user = await ctx.db
      .query('user')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()

    if (!user) throw new Error('User not found')

    // Check if already a member
    const existingMember = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', board._id))
      .filter((q) => q.eq(q.field('userId'), userId))
      .first()

    if (existingMember) throw new Error('Already a member of this board')

    // Add user as board member
    await ctx.db.insert('boardMembers', {
      boardId: board._id,
      userId,
      name: user.name || 'Unknown',
      email: user.email,
      role: 'member',
      joinedAt: Date.now(),
    })

    // Create notification for board owner
    await ctx.db.insert('notifications', {
      userId: board.ownerId,
      type: 'board_joined',
      title: `New member joined ${board.title}`,
      message: `${user.name || user.email} joined your board`,
      data: {
        boardId: board._id,
        userId,
      },
      read: false,
    })

    return { success: true, boardId: board._id }
  },
})

/**
 * Send email invite to users
 * Creates pending invites that users can accept
 * Frontend MUST CALL triggerInviteEmail action to actually send the email
 */
export const createEmailInvite = mutation({
  args: {
    boardId: v.id('boards'),
    email: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    // Verify board exists and user is owner
    const board = await ctx.db.get(args.boardId)
    if (!board) throw new Error('Board not found')
    if (board.ownerId !== userId) {
      throw new Error('Only board owner can send invites')
    }

    // Check if pending invite already exists
    const existing = await ctx.db
      .query('pendingInvites')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .filter((q) => q.eq(q.field('boardId'), args.boardId))
      .first()

    if (existing) throw new Error('Invite already sent to this email')

    // Create pending invite
    const inviteId = await ctx.db.insert('pendingInvites', {
      boardId: args.boardId,
      email: args.email,
      invitedBy: userId,
      message: args.message,
    })

    return {
      inviteId,
      status: 'pending',
      needsEmailTrigger: true, // Signal to frontend to trigger email via action
    }
  },
})
