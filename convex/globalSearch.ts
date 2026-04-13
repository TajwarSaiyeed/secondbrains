import { v } from 'convex/values'
import { query } from './_generated/server'
import { assertIsAuthenticated } from './utils'

export const performGlobalSearch = query({
  args: {
    searchQuery: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await assertIsAuthenticated(ctx)
    const limit = args.limit || 5

    const ownedBoards = await ctx.db
      .query('boards')
      .withIndex('by_owner', (q) => q.eq('ownerId', userId))
      .collect()

    const memberships = await ctx.db
      .query('boardMembers')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const allowedBoardIds = [
      ...ownedBoards.map((b) => b._id),
      ...memberships.map((m) => m.boardId),
    ]
    // Deduplicate
    const uniqueBoardIds = Array.from(new Set(allowedBoardIds))

    if (uniqueBoardIds.length === 0)
      return { notes: [], links: [], messages: [] }

    const notesPromises = uniqueBoardIds.map((boardId) =>
      ctx.db
        .query('notes')
        .withSearchIndex('search_content', (q) =>
          q.search('content', args.searchQuery).eq('boardId', boardId),
        )
        .take(limit),
    )

    const messagesPromises = uniqueBoardIds.map((boardId) =>
      ctx.db
        .query('messages')
        .withSearchIndex('search_content', (q) =>
          q.search('content', args.searchQuery).eq('boardId', boardId),
        )
        .take(limit),
    )

    const linksPromises = uniqueBoardIds.map((boardId) =>
      ctx.db
        .query('links')
        .withSearchIndex('search_title', (q) =>
          q.search('title', args.searchQuery).eq('boardId', boardId),
        )
        .take(limit),
    )

    const [allNotes, allMessages, allLinks] = await Promise.all([
      Promise.all(notesPromises),
      Promise.all(messagesPromises),
      Promise.all(linksPromises),
    ])

    return {
      notes: allNotes.flat().slice(0, limit * 2),
      messages: allMessages.flat().slice(0, limit * 2),
      links: allLinks.flat().slice(0, limit * 2),
    }
  },
})
