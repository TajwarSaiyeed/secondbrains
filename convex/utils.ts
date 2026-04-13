import { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { DataModel, Id } from "./_generated/dataModel";

export async function assertIsAuthenticated(ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  const userId = identity?.subject;
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function assertIsBoardOwner(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  boardId: Id<"boards">
): Promise<{ userId: string; board: any }> {
  const userId = await assertIsAuthenticated(ctx);
  
  const board = await ctx.db.get(boardId);
  if (!board) {
    throw new Error("Board not found");
  }

  if (board.ownerId !== userId) {
    throw new Error("Unauthorized: Only the owner can perform this action");
  }

  return { userId, board };
}

export async function assertIsBoardMember(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  boardId: Id<"boards">
): Promise<{ userId: string; board: any }> {
  const userId = await assertIsAuthenticated(ctx);
  
  const board = await ctx.db.get(boardId);
  if (!board) {
    throw new Error("Board not found");
  }

  // Check if owner or member
  if (board.ownerId === userId) {
    return { userId, board };
  }

  const membership = await ctx.db
    .query("boardMembers")
    .withIndex("by_board", (q) => q.eq("boardId", boardId))
    .filter((q) => q.eq(q.field("userId"), userId))
    .first();

  if (!membership) {
    throw new Error("Unauthorized: You are not a member of this board");
  }

  return { userId, board };
}
