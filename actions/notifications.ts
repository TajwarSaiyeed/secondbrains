"use server";

import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type NotificationType =
  | "board_invite"
  | "board_joined"
  | "message_mention";

export interface NotificationData {
  boardId?: string;
  fromUserId?: string;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData | null;
  read: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<NotificationDTO[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return items.map((n) => ({
    id: n.id,
    userId: n.userId,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    data: (n as unknown as { data?: NotificationData }).data ?? null,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  return prisma.notification.count({ where: { userId: user.id, read: false } });
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { success: true };
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data as unknown as object,
        read: false,
      },
    });
  } catch (e) {
    console.error("Failed to create notification", e);
  }
}

export async function acceptBoardInvite(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const notif = await prisma.notification.findFirst({
    where: { id: notificationId, userId: user.id, type: "board_invite" },
  });
  if (!notif) return { error: "Invalid invitation" };
  const data =
    (notif as unknown as { data?: NotificationData | null }).data ?? null;
  const boardId = data?.boardId;
  if (!boardId) return { error: "Invalid invitation data" };

  const existing = await prisma.boardMember.findFirst({
    where: { boardId, userId: user.id },
  });
  if (!existing) {
    await prisma.boardMember.create({
      data: {
        boardId,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: "member",
        joinedAt: new Date(),
      },
    });
  }

  await prisma.notification.update({
    where: { id: notif.id },
    data: { read: true },
  });

  if (data?.fromUserId) {
    await createNotification(
      data.fromUserId,
      "board_joined",
      "New team member joined",
      `${user.name || user.email} has joined your board`,
      { boardId }
    );
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true as const, boardId };
}
