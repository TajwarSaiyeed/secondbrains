import { mutation, query, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'
import { assertIsAuthenticated } from './utils'

export const insertLinkAction = mutation({
  args: {
    boardId: v.id('boards'),
    url: v.string(),
    title: v.string(),
    description: v.string(),
    authorId: v.string(),
    embedding: v.optional(v.array(v.float64())),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('user')
      .filter((q) => q.eq(q.field('userId'), args.authorId))
      .first()

    const linkId = await ctx.db.insert('links', {
      boardId: args.boardId,
      url: args.url,
      title: args.title,
      description: args.description,
      authorId: args.authorId,
      authorName: user?.name || 'System/AI',
      embedding: args.embedding,
      status: args.embedding ? 'completed' : 'pending',
    })

    if (!args.embedding) {
      // We no longer use the internal Convex scraper.
      // Scraping is now handled exclusively by the Inngest-based crawler
      // triggered from the frontend via triggerWebScrape.
    }

    return linkId
  },
})

/**
 * Get all links for a board
 */
export const getLinksByBoard = query({
  args: {
    boardId: v.id('boards'),
  },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query('links')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()

    return links
  },
})

export const deleteLink = mutation({
  args: {
    linkId: v.id('links'),
  },
  handler: async (ctx, args) => {
    const userId = await assertIsAuthenticated(ctx)

    const link = await ctx.db.get(args.linkId)
    if (!link) {
      throw new Error('Link not found')
    }

    let canDelete = false

    if (link.authorId === userId) {
      canDelete = true
    } else {
      const board = await ctx.db.get(link.boardId)
      if (board && board.ownerId === userId) {
        canDelete = true
      }
    }

    if (!canDelete) {
      throw new Error('Unauthorized to delete this link')
    }

    await ctx.db.delete(args.linkId)
    return true
  },
})

export const getLinkById = internalQuery({
  args: { linkId: v.id('links') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.linkId)
  },
})

export const updateLinkData = mutation({
  args: {
    linkId: v.id('links'),
    scrapedContent: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed'),
    ),
  },
  handler: async (ctx, args) => {
    const { linkId, ...updates } = args
    await ctx.db.patch(linkId, updates)
  },
})
