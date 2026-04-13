import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the currently authenticated user
 * SECURE: Uses ctx.auth.getUserIdentity() - no user-provided userId parameter
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    return user || null;
  },
});

/**
 * Get user by ID - for public/admin queries, NOT for current user
 */
export const getById = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return user || null;
  },
});

/**
 * Securely update authenticated user's profile
 * SECURE: Gets userId from auth context, not from args
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    telegram: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: Record<string, any> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.whatsapp !== undefined) updates.whatsapp = args.whatsapp;
    if (args.telegram !== undefined) updates.telegram = args.telegram;
    updates.updatedAt = Date.now();

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return user._id;
  },
});

/**
 * Securely update authenticated user's settings
 * SECURE: Gets userId from auth context, not from args
 */
export const updateSettings = mutation({
  args: {
    emailNotifications: v.optional(v.boolean()),
    aiSuggestions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (settings) {
      await ctx.db.patch(settings._id, {
        emailNotifications:
          args.emailNotifications ?? settings.emailNotifications,
        aiSuggestions: args.aiSuggestions ?? settings.aiSuggestions,
      });
    } else {
      await ctx.db.insert("userSettings", {
        userId: identity.subject,
        emailNotifications: args.emailNotifications ?? true,
        aiSuggestions: args.aiSuggestions ?? true,
      });
    }

    return true;
  },
});

/**
 * Get all users (admin/internal use)
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("user").collect();
  },
});

/**
 * Get total user count
 */
export const count = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("user").collect();
    return users.length;
  },
});

/**
 * Admin mutation to set user role
 * Only admins and super_admins can assign roles to users
 */
export const setRole = mutation({
  args: {
    userId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.auth.getUserIdentity();
    if (!caller) {
      throw new Error("Not authenticated");
    }

    const callerUser = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", caller.subject))
      .first();

    if (
      !callerUser ||
      (callerUser.role !== "admin" && callerUser.role !== "super_admin")
    ) {
      throw new Error("Unauthorized: Only admins can assign roles");
    }

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { role: args.role });
    return user._id;
  },
});
