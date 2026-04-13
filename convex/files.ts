import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertIsAuthenticated } from "./utils";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFileMetaData = mutation({
  args: {
    storageId: v.id("_storage"),
    boardId: v.id("boards"),
    name: v.string(),
    size: v.number(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await assertIsAuthenticated(ctx);

    // For standard files, we can use `ctx.storage.getUrl(storageId)`
    const url = await ctx.storage.getUrl(args.storageId);

    if (!url) {
      throw new Error("Failed to get storage URL");
    }

    const fileMetaId = await ctx.db.insert("fileMetas", {
      boardId: args.boardId,
      name: args.name,
      size: args.size,
      type: args.type,
      storageId: args.storageId,
      url: url,
      uploadedBy: userId,
    });

    return fileMetaId;
  },
});

export const getFilesByBoard = query({
  args: {
    boardId: v.id("boards"),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("fileMetas")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();

    return files;
  },
});

export const deleteFile = mutation({
  args: {
    fileId: v.id("fileMetas"),
  },
  handler: async (ctx, args) => {
    const userId = await assertIsAuthenticated(ctx);

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");

    let canDelete = file.uploadedBy === userId;

    if (!canDelete) {
      // Check if user is board owner
      const board = await ctx.db.get(file.boardId);
      if (board && board.ownerId === userId) {
        canDelete = true;
      }
    }

    if (!canDelete) {
      throw new Error(
        "Unauthorized: only uploader or board owner can delete files",
      );
    }

    // Delete the file from Convex Storage physically
    await ctx.storage.delete(file.storageId);

    // Delete the metadata from database
    await ctx.db.delete(args.fileId);

    return { success: true };
  },
});

export const getFileDetails = query({
  args: {
    fileId: v.id("fileMetas"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");
    return file;
  },
});
