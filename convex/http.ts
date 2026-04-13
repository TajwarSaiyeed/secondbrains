import { httpRouter } from "convex/server";
import { createClient, convexAdapter } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import { betterAuth } from "better-auth";
import {
  ActionCtx,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import authConfig from "./auth.config";

const http = httpRouter();

const client = createClient(components.betterAuth);

client.registerRoutes(http, (ctx) =>
  betterAuth({
    database: convexAdapter(ctx, { adapter: components.betterAuth.adapter }),
    baseURL: process.env.CONVEX_SITE_URL,
    trustedOrigins: [process.env.SITE_URL!],
    emailAndPassword: {
      enabled: true,
    },
    user: {
      changeEmail: { enabled: false },
    },
    plugins: [convex({ authConfig })],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await (ctx as unknown as ActionCtx).runMutation(
              internal.http.syncUserToApp,
              {
                userId: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                image: user.image ?? null,
                createdAt: user.createdAt.getTime(),
                updatedAt: user.updatedAt.getTime(),
              },
            );
          },
        },
      },
    },
  }),
);

// Internal mutation to sync a Better Auth user to the app's user table
export const syncUserToApp = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.union(v.null(), v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (existing) return;

    await ctx.db.insert("user", {
      userId: args.userId,
      name: args.name,
      email: args.email,
      emailVerified: args.emailVerified,
      image: args.image,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
      role: "user",
    });
  },
});

// Internal query to list users from the Better Auth component tables
export const listComponentUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      paginationOpts: { cursor: null, numItems: 100 },
    });
  },
});

export default http;
