"use server";

import "server-only";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notifications";

export async function getBoards() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  try {
    const db = await getDb();
    const boards = await db
      .collection("boards")
      .find({
        $or: [{ ownerId: user._id }, { "members.userId": user._id }],
      })
      .sort({ updatedAt: -1 })
      .toArray();

    return boards.map((board) => ({
      _id: board._id.toString(),
      title: board.title || "",
      description: board.description || "",
      ownerId: board.ownerId.toString(),
      members:
        board.members?.map((member: any) => ({
          userId: member.userId.toString(),
          name: member.name,
          email: member.email,
          role: member.role,
        })) || [],
      notes:
        board.notes?.map((note: any) => ({
          id: note.id || note._id?.toString(),
        })) || [],
      links:
        board.links?.map((link: any) => ({
          id: link.id || link._id?.toString(),
        })) || [],
      files:
        board.files?.map((file: any) => ({
          id: file.id || file._id?.toString(),
        })) || [],
      updatedAt: board.updatedAt?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching boards:", error);
    return [];
  }
}

export async function createBoard(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!title || !description) {
    return { error: "Title and description are required" };
  }

  let newBoardId: string | null = null;
  try {
    const db = await getDb();
    const result = await db.collection("boards").insertOne({
      title,
      description,
      ownerId: new ObjectId(user._id),
      members: [
        {
          userId: new ObjectId(user._id),
          name: user.name,
          email: user.email,
          role: "owner",
          joinedAt: new Date(),
        },
      ],
      notes: [],
      links: [],
      files: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    newBoardId = result.insertedId.toString();
  } catch (error) {
    console.error("Error creating board:", error);
    return { error: "Failed to create board" };
  }

  redirect(`/dashboard/${newBoardId}`);
}

export async function getBoard(boardId: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
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
      return null;
    }

    return {
      ...board,
      _id: board._id.toString(),
      ownerId: board.ownerId.toString(),
      members: board.members.map((member: any) => ({
        ...member,
        userId: member.userId.toString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching board:", error);
    return null;
  }
}

export async function deleteBoard(boardId: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let deleted = false;
  try {
    const db = await getDb();
    const result = await db.collection("boards").deleteOne({
      _id: new ObjectId(boardId),
      ownerId: new ObjectId(user._id),
    });

    if (result.deletedCount === 0) {
      return {
        error: "Board not found or you don't have permission to delete it",
      };
    }
    deleted = true;
  } catch (error) {
    console.error("Error deleting board:", error);
    return { error: "Failed to delete board" };
  }

  if (deleted) {
    redirect("/dashboard");
  }
}

export async function generateInvite(boardId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const db = await getDb();
    const token = new ObjectId().toString();
    await db.collection("boards").updateOne({ _id: new ObjectId(boardId) }, {
      $set: { inviteToken: token, updatedAt: new Date() },
    } as any);
    const link = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/invite/${token}`;
    return { link };
  } catch (e) {
    console.error("Error generating invite:", e);
    return { error: "Failed to generate invite link" };
  }
}

export async function inviteUsers(
  boardId: string,
  emails: string[],
  message?: string
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const unique = Array.from(
    new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))
  );
  if (unique.length === 0) return { error: "No valid emails" };

  try {
    const db = await getDb();

    const board = await db.collection("boards").findOne({
      _id: new ObjectId(boardId),
      ownerId: new ObjectId(user._id),
    });

    if (!board) {
      return { error: "Board not found or you don't have permission" };
    }

    const existingUsers = await db
      .collection("users")
      .find({ email: { $in: unique } })
      .toArray();

    const existingEmails = existingUsers.map((u) => u.email.toLowerCase());
    const pendingEmails = unique.filter(
      (email) => !existingEmails.includes(email)
    );

    for (const existingUser of existingUsers) {
      await createNotification(
        existingUser._id.toString(),
        "board_invite",
        "Board Invitation",
        `${user.name} invited you to join "${board.title}"${
          message ? `: ${message}` : ""
        }`,
        {
          boardId: boardId,
          fromUserId: user._id.toString(),
          fromUserName: user.name,
        }
      );
    }

    if (pendingEmails.length > 0) {
      await db.collection("boards").updateOne({ _id: new ObjectId(boardId) }, {
        $addToSet: {
          pendingInvites: {
            $each: pendingEmails.map((email) => ({
              email,
              invitedBy: user._id.toString(),
              invitedAt: new Date(),
              message,
            })),
          },
        },
        $set: { updatedAt: new Date() },
      } as any);
    }

    revalidatePath(`/dashboard/${boardId}`);
    return {
      success: true,
      notified: existingEmails.length,
      pending: pendingEmails.length,
    };
  } catch (e) {
    console.error("Error inviting users:", e);
    return { error: "Failed to send invitations" };
  }
}
