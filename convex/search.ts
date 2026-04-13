import { v } from "convex/values";
import { action, query, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

export const searchBoards = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    if (!userId) return []; // Unauthenticated

    const ownedBoards = await ctx.db
      .query("boards")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const memberships = await ctx.db
      .query("boardMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const memberBoards = await Promise.all(
      memberships.map(async (m) => await ctx.db.get(m.boardId)),
    );

    const allBoards = [
      ...ownedBoards,
      ...memberBoards.filter((b) => b !== null),
    ];
    const uniqueBoards = Array.from(
      new Map(allBoards.map((item) => [item!._id, item])).values(),
    );

    const queryLower = args.query.toLowerCase();
    return uniqueBoards.filter(
      (board) =>
        board.title.toLowerCase().includes(queryLower) ||
        board.description.toLowerCase().includes(queryLower),
    );
  },
});

export const resolveNotes = internalQuery({
  args: { ids: v.array(v.id("notes")) },
  handler: async (ctx, args) => {
      const docs = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
      return docs.filter((d): d is NonNullable<typeof d> => d !== null);
    },
  });

  export const resolveLinks = internalQuery({
    args: { ids: v.array(v.id("links")) },
    handler: async (ctx, args) => {
      const docs = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
      return docs.filter((d): d is NonNullable<typeof d> => d !== null);
    },
  });

  export const keywordSearch = internalQuery({
    args: {
      boardId: v.id("boards"),
      query: v.string(),
      limit: v.number(),
    },
    handler: async (ctx, args) => {
      const noteResults = await ctx.db
        .query("notes")
        .withSearchIndex("search_content", (q) =>
          q.search("content", args.query).eq("boardId", args.boardId),
        )
        .take(args.limit);

      const linkTitleResults = await ctx.db
        .query("links")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.query).eq("boardId", args.boardId),
        )
        .take(args.limit);

      const linkDescResults = await ctx.db
        .query("links")
        .withSearchIndex("search_description", (q) =>
          q.search("description", args.query).eq("boardId", args.boardId),
        )
        .take(args.limit);

      const linkScrapedResults = await ctx.db
        .query("links")
        .withSearchIndex("search_scraped", (q) =>
          q.search("scrapedContent", args.query).eq("boardId", args.boardId),
        )
        .take(args.limit);

      const uniqueLinks = Array.from(
        new Map(
          [...linkTitleResults, ...linkDescResults, ...linkScrapedResults].map((l) => [l._id, l]),
        ).values(),
      );

      return {
        notes: noteResults,
        links: uniqueLinks,
      };
    },
  });

  export const semanticSearch = action({
    args: {
      boardId: v.id("boards"),
      query: v.string(),
      limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthorized");

      const limit = args.limit ?? 10;
      let vector: number[] = [];

      try {
        const result = await model.embedContent(args.query);
        vector = result.embedding.values;
      } catch (error) {
        console.error("Embedding generation failed:", error);
      }

      let noteResults: any[] = [];
      let linkResults: any[] = [];

      if (vector && vector.length > 0) {
        noteResults = await ctx.vectorSearch("notes", "by_embedding", {
          vector,
          limit,
          filter: (q) => q.eq("boardId", args.boardId),
        });

        linkResults = await ctx.vectorSearch("links", "by_embedding", {
          vector,
          limit,
          filter: (q) => q.eq("boardId", args.boardId),
        });
      }

      // Fetch Full Docs for semantic points
      const noteDocs = await ctx.runQuery(internal.search.resolveNotes, {
        ids: noteResults.map((r) => r._id) as any,
      });

      const linkDocs = await ctx.runQuery(internal.search.resolveLinks, {
        ids: linkResults.map((r) => r._id) as any,
      });

      // Fetch Text Matches
      const keywordDocs = await ctx.runQuery(internal.search.keywordSearch, {
        boardId: args.boardId,
        query: args.query,
        limit,
      });

      // Reciprocal Rank Fusion (hybrid merge logic)
      const RRF_CONSTANT = 60;
      const combinedScores = new Map<string, { doc: any; score: number; type: "note" | "link" }>();

      // Factor Vectors
      noteDocs.forEach((doc: any, i: number) => {
        const _id = doc._id.toString();
        const score = 1 / (RRF_CONSTANT + i + 1);
        combinedScores.set(_id, { doc, score, type: "note" });
      });

      linkDocs.forEach((doc: any, i: number) => {
        const _id = doc._id.toString();
        const score = 1 / (RRF_CONSTANT + i + 1);
        combinedScores.set(_id, { doc, score, type: "link" });
      });

      // Combine Keywords
      keywordDocs.notes.forEach((doc: any, i: number) => {
        const _id = doc._id.toString();
        const existing = combinedScores.get(_id) || { doc, score: 0, type: "note" };
        existing.score += 1 / (RRF_CONSTANT + i + 1);
        combinedScores.set(_id, existing);
      });

      keywordDocs.links.forEach((doc: any, i: number) => {
        const _id = doc._id.toString();
        const existing = combinedScores.get(_id) || { doc, score: 0, type: "link" };
        existing.score += 1 / (RRF_CONSTANT + i + 1);
        combinedScores.set(_id, existing);
      });

      const combined = Array.from(combinedScores.values())
        .map((item) => ({ ...item.doc, type: item.type, score: item.score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return combined;
    },
  });
