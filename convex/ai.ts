import { v } from 'convex/values'
import { mutation, query, action } from './_generated/server'
import { api } from './_generated/api'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const chatWithBoard = action({
  args: {
    boardId: v.id('boards'),
    message: v.string(),
    history: v.optional(
      v.array(v.object({ role: v.string(), content: v.string() })),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    // Perform hybrid search to gather context
    const searchResults: any[] = await ctx.runAction(
      api.search.semanticSearch as any,
      {
        boardId: args.boardId,
        query: args.message,
        limit: 10,
      },
    )

    // Format context mapping for the system prompt
    let contextStr = 'Retrieved Context:\n'
    searchResults.forEach((doc: any, i: number) => {
      const content =
        doc.scrapedContent || doc.content || doc.description || doc.title || ''
      contextStr += `\n[${i + 1}] Type: ${doc.type}\nContent: ${content}\nUrl: ${doc.url || 'N/A'}\n---`
    })

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Setup history for conversational API
    const formattedHistory = (args.history || []).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    const chatSession = model.startChat({
      history: [
        {
          role: 'user',
          parts: [
            {
              text: "You are an AI assistant helping a user query their knowledge board (called 'secondbrains'). You must answer questions primarily based on the 'Retrieved Context' provided in future messages. Do not hallucinate external details unless context does not provide sufficient info, in which case naturally state that the context lacks those details.",
            },
          ],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'Understood. I will provide accurate answers relying only on the loaded Context chunks, and alert you if the information is missing from the provided sources.',
            },
          ],
        },
        ...formattedHistory,
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    })

    const promptWithContext = `User Query: ${args.message}\n\n${contextStr}`

    try {
      const response = await chatSession.sendMessage(promptWithContext)
      return {
        text: response.response.text(),
        sources: searchResults.map((r: any) => ({
          id: r._id,
          title: r.title || r.fileName || `Note by ${r.authorName}`,
          url: r.url || null,
          type: r.type,
        })),
      }
    } catch (error) {
      console.error('Gemini cRAG Chat Failed:', error)
      throw new Error('Unable to fulfill AI request.')
    }
  },
})

export const getBoardSummary = query({
  args: {
    boardId: v.id('boards'),
  },
  handler: async (ctx, args) => {
    const summary = await ctx.db
      .query('aiSummaries')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .first()

    return summary ? summary.content : null
  },
})

/**
 * Store AI summary in database
 */
export const storeSummary = mutation({
  args: {
    boardId: v.id('boards'),
    content: v.string(),
    generatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Delete any existing summary for this board
    const existing = await ctx.db
      .query('aiSummaries')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
    }

    // Store the new summary
    const summaryId = await ctx.db.insert('aiSummaries', {
      boardId: args.boardId,
      content: args.content,
      generatedBy: args.generatedBy,
    })

    return summaryId
  },
})

/**
 * Trigger AI summary generation

 * This mutation marks that a summary is requested and can be called from a client action
 * that then triggers Inngest via an HTTP endpoint
 */
export const requestSummary = mutation({
  args: {
    boardId: v.id('boards'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    // Verify board exists and user has access
    const board = await ctx.db.get(args.boardId)
    if (!board) throw new Error('Board not found')

    // Verify user is owner or member
    const isOwner = board.ownerId === userId
    let canAccess = isOwner

    if (!canAccess) {
      const isMember = await ctx.db
        .query('boardMembers')
        .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
        .filter((q) => q.eq(q.field('userId'), userId))
        .first()
      canAccess = !!isMember
    }

    if (!canAccess) throw new Error('Access denied')

    return {
      status: 'requested',
      message: 'AI summary generation has been queued',
      boardId: args.boardId,
    }
  },
})
