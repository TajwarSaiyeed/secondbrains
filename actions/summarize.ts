"use server";

import "server-only";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { summarizeContent } from "@/lib/ai";

export async function summarizeDiscussion(
  boardId: string,
  options: {
    days?: number;
    messageIds?: string[];
    startDate?: string;
    endDate?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const db = await getDb();

    const board = await db.collection("boards").findOne({
      _id: new ObjectId(boardId),
      $or: [
        { ownerId: new ObjectId(user._id) },
        { "members.userId": new ObjectId(user._id) },
      ],
    });

    if (!board) {
      return { error: "Board not found or access denied" };
    }

    let query: any = { boardId: new ObjectId(boardId) };

    if (options.messageIds && options.messageIds.length > 0) {
      query._id = { $in: options.messageIds.map((id) => new ObjectId(id)) };
    } else if (options.days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - options.days);
      query.createdAt = { $gte: daysAgo };
    } else if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) {
        query.createdAt.$gte = new Date(options.startDate);
      }
      if (options.endDate) {
        query.createdAt.$lte = new Date(options.endDate);
      }
    }

    const messages = await db
      .collection("messages")
      .find(query)
      .sort({ createdAt: 1 })
      .toArray();

    if (messages.length === 0) {
      return { error: "No messages found for the specified criteria" };
    }

    const messageText = messages
      .map(
        (msg: any) =>
          `${msg.authorName} (${new Date(msg.createdAt).toLocaleString()}): ${
            msg.content
          }`
      )
      .join("\n");

    const summary = await summarizeContent(
      `Please summarize this discussion from "${board.title}":\n\n${messageText}`
    );

    await db.collection("messages").insertOne({
      boardId: new ObjectId(boardId),
      content: `📋 **Discussion Summary (${
        options.days ? `${options.days} days` : "Selected messages"
      })**\n\n${summary}`,
      authorId: "ai",
      authorName: "MindMesh AI",
      type: "ai",
      createdAt: new Date(),
    });

    revalidatePath(`/dashboard/${boardId}/discussion`);
    return { success: true, summary, messageCount: messages.length };
  } catch (error) {
    console.error("Error summarizing discussion:", error);
    return { error: "Failed to summarize discussion" };
  }
}
