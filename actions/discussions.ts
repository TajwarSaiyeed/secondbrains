"use server";

import "server-only";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { answerQuestion } from "@/lib/ai";

export async function getMessages(boardId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const db = await getDb();

    const board = await db.collection("boards").findOne({
      _id: new ObjectId(boardId),
      $or: [
        { ownerId: new ObjectId(user._id) },
        { "members.userId": new ObjectId(user._id) },
      ],
    });

    if (!board) return [];

    const messages = await db
      .collection("messages")
      .find({ boardId: new ObjectId(boardId) })
      .sort({ createdAt: 1 })
      .toArray();

    return messages.map((message) => ({
      _id: message._id.toString(),
      boardId: message.boardId.toString(),
      content: message.content,
      authorId: message.authorId,
      authorName: message.authorName,
      type: message.type,
      createdAt: message.createdAt.toISOString(),
      id: message._id.toString(),
    }));
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

export async function sendMessage(boardId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  if (!content.trim()) return { error: "Message content is required" };

  try {
    const db = await getDb();

    const board = await db.collection("boards").findOne({
      _id: new ObjectId(boardId),
      $or: [
        { ownerId: new ObjectId(user._id) },
        { "members.userId": new ObjectId(user._id) },
      ],
    });

    if (!board) return { error: "Board not found or access denied" };

    await db.collection("messages").insertOne({
      boardId: new ObjectId(boardId),
      content: content.trim(),
      authorId: user._id.toString(),
      authorName: user.name,
      type: "user",
      createdAt: new Date(),
    });

    revalidatePath(`/dashboard/${boardId}/discussion`);
    return { success: true };
  } catch (error) {
    console.error("Error sending message:", error);
    return { error: "Failed to send message" };
  }
}

export async function askAI(boardId: string, question: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  if (!question.trim()) return { error: "Question is required" };

  try {
    const db = await getDb();

    const board = await db.collection("boards").findOne({
      _id: new ObjectId(boardId),
      $or: [
        { ownerId: new ObjectId(user._id) },
        { "members.userId": new ObjectId(user._id) },
      ],
    });

    if (!board) return { error: "Board not found or access denied" };

    const recentMessages = await db
      .collection("messages")
      .find({ boardId: new ObjectId(boardId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const context = [
      `Board: ${board.title}`,
      `Description: ${board.description}`,
      ...(board.notes || []).map((note: any) => `Note: ${note.content}`),
      ...(board.links || []).map(
        (link: any) => `Link: ${link.title} - ${link.description}`
      ),
      ...recentMessages
        .reverse()
        .map((msg: any) => `${msg.authorName}: ${msg.content}`),
    ].join("\n");

    const aiResponse = await answerQuestion(question, context);

    await db.collection("messages").insertOne({
      boardId: new ObjectId(boardId),
      content: question.trim(),
      authorId: user._id.toString(),
      authorName: user.name,
      type: "user",
      createdAt: new Date(),
    });

    await db.collection("messages").insertOne({
      boardId: new ObjectId(boardId),
      content: aiResponse,
      authorId: "ai",
      authorName: "MindMesh AI",
      type: "ai",
      createdAt: new Date(),
    });

    revalidatePath(`/dashboard/${boardId}/discussion`);
    return { success: true, response: aiResponse };
  } catch (error) {
    console.error("Error asking AI:", error);
    return { error: "Failed to get AI response" };
  }
}

export async function deleteMessage(boardId: string, messageId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const db = await getDb();

    const message = await db.collection("messages").findOne({
      _id: new ObjectId(messageId),
      boardId: new ObjectId(boardId),
    });

    if (!message) return { error: "Message not found" };

    const board = await db.collection("boards").findOne({
      _id: new ObjectId(boardId),
    });

    const canDelete =
      message.authorId === user._id.toString() ||
      board?.ownerId?.toString() === user._id.toString();

    if (!canDelete) return { error: "Permission denied" };

    await db.collection("messages").deleteOne({
      _id: new ObjectId(messageId),
    });

    revalidatePath(`/dashboard/${boardId}/discussion`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { error: "Failed to delete message" };
  }
}
