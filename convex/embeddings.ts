import { v } from 'convex/values'
import { action, internalMutation } from './_generated/server'
import { api, internal } from './_generated/api'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

export const generateNoteEmbedding = action({
  args: { noteId: v.id('notes'), content: v.string() },
  handler: async (ctx, args) => {
    try {
      const result = await model.embedContent(args.content)
      const embedding = result.embedding.values

      await ctx.runMutation(internal.embeddings.saveNoteEmbedding, {
        noteId: args.noteId,
        embedding: embedding,
      })
    } catch (error) {
      console.error(
        'Failed to generate embedding for note:',
        args.noteId,
        error,
      )
    }
  },
})

export const saveNoteEmbedding = internalMutation({
  args: {
    noteId: v.id('notes'),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, { embedding: args.embedding })
  },
})

export const generateLinkEmbedding = action({
  args: { linkId: v.id('links'), content: v.string() },
  handler: async (ctx, args) => {
    try {
      const result = await model.embedContent(args.content)
      const embedding = result.embedding.values

      await ctx.runMutation(internal.embeddings.saveLinkEmbedding, {
        linkId: args.linkId,
        embedding: embedding,
      })
    } catch (error) {
      console.error(
        'Failed to generate embedding for link:',
        args.linkId,
        error,
      )
    }
  },
})

export const saveLinkEmbedding = internalMutation({
  args: {
    linkId: v.id('links'),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.linkId, { embedding: args.embedding })
  },
})
