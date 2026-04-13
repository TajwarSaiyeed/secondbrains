import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

type NotificationType = 'board_invite' | 'board_joined' | 'message_mention'

export const createNotification = mutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal('board_invite'),
      v.literal('board_joined'),
      v.literal('message_mention'),
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('notifications', {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data || {},
      read: false,
    })
  },
})

export const countUnread = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) return 0

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('read'), false))
      .collect()

    return notifications.length
  },
})

export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) return []

    return await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})

export const markAsRead = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) throw new Error('Notification not found')

    if (notification.userId !== userId) {
      throw new Error('Unauthorized to mark this notification as read')
    }

    await ctx.db.patch(args.notificationId, { read: true })
    return true
  },
})

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = identity?.subject
    if (!userId) throw new Error('Unauthorized')

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('read'), false))
      .collect()

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, { read: true })
    }

    return true
  },
})
