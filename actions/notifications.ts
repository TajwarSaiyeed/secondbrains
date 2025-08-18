"use server";

import "server-only";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type NotificationType =
  | "board_invite"
  | "board_joined"
  | "message_mention";

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    boardId?: string;
    inviteToken?: string;
    fromUserId?: string;
    fromUserName?: string;
  };
  read: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<Notification[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const db = await getDb();
    const notifications = await db
      .collection("notifications")
      .find({ userId: new ObjectId(user._id) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return notifications.map((notif) => ({
      _id: notif._id.toString(),
      userId: notif.userId.toString(),
      type: notif.type,
      title: notif.title,
      message: notif.message,
      data: notif.data,
      read: notif.read,
      createdAt: notif.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Notification["data"]
) {
  try {
    const db = await getDb();
    await db.collection("notifications").insertOne({
      userId: new ObjectId(userId),
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const db = await getDb();
    await db.collection("notifications").updateOne(
      {
        _id: new ObjectId(notificationId),
        userId: new ObjectId(user._id),
      },
      {
        $set: { read: true },
      }
    );

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { error: "Failed to mark notification as read" };
  }
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const db = await getDb();
    await db.collection("notifications").updateMany(
      {
        userId: new ObjectId(user._id),
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { error: "Failed to mark notifications as read" };
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  try {
    const db = await getDb();
    const count = await db.collection("notifications").countDocuments({
      userId: new ObjectId(user._id),
      read: false,
    });
    return count;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
}

export async function acceptBoardInvite(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const db = await getDb();

    const notification = await db.collection("notifications").findOne({
      _id: new ObjectId(notificationId),
      userId: new ObjectId(user._id),
      type: "board_invite",
    });

    if (!notification || !notification.data?.boardId) {
      return { error: "Invalid invitation" };
    }

    const board = await db.collection("boards").findOne({
      _id: new ObjectId(notification.data.boardId),
      "members.userId": new ObjectId(user._id),
    });

    if (board) {
      return { error: "You are already a member of this board" };
    }

    await db.collection("boards").updateOne(
      { _id: new ObjectId(notification.data.boardId) },
      {
        $push: {
          members: {
            userId: new ObjectId(user._id),
            name: user.name,
            email: user.email,
            role: "member",
            joinedAt: new Date(),
          },
        } as any,
        $set: { updatedAt: new Date() },
      }
    );

    await db
      .collection("notifications")
      .updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { read: true } }
      );

    if (notification.data.fromUserId) {
      await createNotification(
        notification.data.fromUserId,
        "board_joined",
        "New team member joined",
        `${user.name} has joined your board`,
        { boardId: notification.data.boardId }
      );
    }

    revalidatePath("/notifications");
    revalidatePath("/dashboard");
    return { success: true, boardId: notification.data.boardId };
  } catch (error) {
    console.error("Error accepting board invite:", error);
    return { error: "Failed to accept invitation" };
  }
}
