import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { components } from './_generated/api'
import { Presence } from '@convex-dev/presence'

export const client = new Presence(components.presence)

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, args) => {
    return await client.heartbeat(
      ctx,
      args.roomId,
      args.userId,
      args.sessionId,
      args.interval,
    )
  },
})

export const list = query({
  args: {
    roomToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await client.list(ctx, args.roomToken, args.limit)
  },
})

export const disconnect = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    return await client.disconnect(ctx, args.sessionToken)
  },
})

export const updateRoomUser = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    return await client.updateRoomUser(ctx, args.roomId, args.userId, args.data)
  },
})
