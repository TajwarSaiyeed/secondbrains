import {
  assertIsAuthenticated,
  assertIsBoardOwner,
  assertIsBoardMember,
} from './utils'
import { query, mutation, action } from './_generated/server'
import { v } from 'convex/values'

export const listBoards = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) return [] // Unauthenticated

    const ownedBoards = await ctx.db
      .query('boards')
      .withIndex('by_owner', (q) => q.eq('ownerId', userId))
      .collect()

    const memberships = await ctx.db
      .query('boardMembers')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const memberBoards = await Promise.all(
      memberships.map(async (m) => await ctx.db.get(m.boardId)),
    )

    // Combine and strip any nulls
    const allBoards = [
      ...ownedBoards,
      ...memberBoards.filter((b) => b !== null),
    ]

    // De-duplicate just in case
    return Array.from(
      new Map(allBoards.map((item) => [item!._id, item])).values(),
    )
  },
})

export const updateBoard = mutation({
  args: {
    boardId: v.id('boards'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, board } = await assertIsBoardOwner(ctx, args.boardId)

    await ctx.db.patch(args.boardId, {
      title: args.title,
      description: args.description,
    })

    return args.boardId
  },
})

export const deleteBoard = mutation({
  args: {
    boardId: v.id('boards'),
  },
  handler: async (ctx, args) => {
    const { userId, board } = await assertIsBoardOwner(ctx, args.boardId)

    const members = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()

    for (const member of members) {
      await ctx.db.delete(member._id)
    }

    await ctx.db.delete(args.boardId)
    return true
  },
})

export const addMember = mutation({
  args: {
    boardId: v.id('boards'),
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal('owner'), v.literal('member')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const currentUserId = identity?.subject
    if (!currentUserId) throw new Error('Unauthorized')

    const board = await ctx.db.get(args.boardId)
    if (!board) throw new Error('Board not found')

    if (board.ownerId !== currentUserId) {
      throw new Error('Only the owner can add members')
    }

    // Check if already a member
    const existing = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first()

    if (existing) throw new Error('User is already a member of this board')

    await ctx.db.insert('boardMembers', {
      boardId: args.boardId,
      userId: args.userId,
      name: args.name,
      email: args.email,
      role: args.role,
      joinedAt: Date.now(),
    })

    return true
  },
})

export const removeMember = mutation({
  args: {
    boardId: v.id('boards'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const currentUserId = identity?.subject
    if (!currentUserId) throw new Error('Unauthorized')

    const board = await ctx.db.get(args.boardId)
    if (!board) throw new Error('Board not found')

    if (board.ownerId !== currentUserId) {
      throw new Error('Only the owner can remove members')
    }

    const membership = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first()

    if (!membership) throw new Error('Member not found')

    await ctx.db.delete(membership._id)
    return true
  },
})

export const createBoard = mutation({
  args: {
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await assertIsAuthenticated(ctx)

    const boardId = await ctx.db.insert('boards', {
      title: args.title,
      description: args.description,
      ownerId: userId,
    })

    return boardId
  },
})

export const getBoardDetails = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) return null

    const board = await ctx.db.get(args.boardId)
    if (!board) return null

    // Fast check: Is owner?
    if (board.ownerId === userId) {
      // Get aggregations for board
      const members = await ctx.db
        .query('boardMembers')
        .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
        .collect()

      const notes = await ctx.db
        .query('notes')
        .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
        .collect()

      const links = await ctx.db
        .query('links')
        .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
        .collect()

      const files = await ctx.db
        .query('fileMetas')
        .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
        .collect()

      return {
        ...board,
        memberCount: members.length + 1, // +1 for owner
        noteCount: notes.length,
        linkCount: links.length,
        fileCount: files.length,
      }
    }

    // Check if member
    const membership = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .first()

    if (!membership) return null // Not authorized

    // Get aggregations for board
    const members = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()

    const notes = await ctx.db
      .query('notes')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()

    const links = await ctx.db
      .query('links')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()

    const files = await ctx.db
      .query('fileMetas')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()

    return {
      ...board,
      memberCount: members.length + 1, // +1 for owner
      noteCount: notes.length,
      linkCount: links.length,
      fileCount: files.length,
    }
  },
})

export const joinViaInviteToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    const board = await ctx.db
      .query('boards')
      .withIndex('by_invite', (q) => q.eq('inviteToken', args.token))
      .first()

    if (!board) throw new Error('Invalid invite token')

    // Don't add owner as member again
    if (board.ownerId === userId) {
      return board._id
    }

    const existing = await ctx.db
      .query('boardMembers')
      .withIndex('by_board', (q) => q.eq('boardId', board._id))
      .filter((q) => q.eq(q.field('userId'), userId))
      .first()

    if (!existing) {
      await ctx.db.insert('boardMembers', {
        boardId: board._id,
        userId: userId,
        name: identity.name || 'Unknown User',
        email: identity.email || '',
        role: 'member',
        joinedAt: Date.now(),
      })
    }

    return board._id
  },
})
