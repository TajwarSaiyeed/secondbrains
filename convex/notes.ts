import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { api } from './_generated/api'

import {
  assertIsAuthenticated,
  assertIsBoardOwner,
  assertIsBoardMember,
} from './utils'

export const createNote = mutation({
  args: {
    boardId: v.id('boards'),
    content: v.string(),
    authorName: v.string(),
    authorId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.authorId) {
      throw new Error('Unauthenticated')
    }

    const user = await ctx.db
      .query('user')
      .filter((q) => q.eq(q.field('userId'), args.authorId))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    const noteId = await ctx.db.insert('notes', {
      boardId: args.boardId,
      content: args.content,
      authorId: args.authorId,
      authorName: user.name,
    })

    // Schedule vector embedding generation
    await ctx.scheduler.runAfter(0, api.embeddings.generateNoteEmbedding, {
      noteId,
      content: args.content,
    })

    return noteId
  },
})

export const updateNote = mutation({
  args: {
    noteId: v.id('notes'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId)
    if (!note) {
      throw new Error('Note not found')
    }

    await ctx.db.patch(args.noteId, { content: args.content })

    // Schedule vector embedding generation for updated content
    await ctx.scheduler.runAfter(0, api.embeddings.generateNoteEmbedding, {
      noteId: args.noteId,
      content: args.content,
    })

    return args.noteId
  },
})

export const deleteNote = mutation({
  args: {
    noteId: v.id('notes'),
  },
  handler: async (ctx, args) => {
    const userId = await assertIsAuthenticated(ctx)

    const note = await ctx.db.get(args.noteId)
    if (!note) {
      throw new Error('Note not found')
    }

    let canDelete = false

    if (note.authorId === userId) {
      canDelete = true
    } else {
      const board = await ctx.db.get(note.boardId)
      if (board && board.ownerId === userId) {
        canDelete = true
      }
    }

    if (!canDelete) {
      throw new Error('Unauthorized to delete this note')
    }

    await ctx.db.delete(args.noteId)
    return true
  },
})

export const getNotesByBoard = query({
  args: {
    boardId: v.id('boards'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('notes')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
  },
})
