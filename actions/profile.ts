"use server";

import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  settings: { emailNotifications: boolean; aiSuggestions: boolean };
};

export async function getUser(userId?: string): Promise<UserDTO | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const id = userId || user.id;
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return null;
  const settings = await prisma.userSettings.findUnique({
    where: { userId: id },
  });
  return {
    id: u.id,
    name: u.name || "",
    email: u.email || "",
    createdAt: (u.createdAt instanceof Date
      ? u.createdAt
      : new Date()
    ).toISOString(),
    updatedAt: (u.updatedAt instanceof Date
      ? u.updatedAt
      : new Date()
    ).toISOString(),
    settings: settings
      ? {
          emailNotifications: settings.emailNotifications,
          aiSuggestions: settings.aiSuggestions,
        }
      : { emailNotifications: true, aiSuggestions: true },
  };
}

export type UpdateProfileResult = { success: true } | { error: string };

export async function updateProfile(
  formData: FormData
): Promise<UpdateProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  if (!name || !email) return { error: "Name and email are required" };

  const exists = await prisma.user.findFirst({
    where: { email, NOT: { id: user.id } },
  });
  if (exists) return { error: "Email is already taken" };

  await prisma.user.update({ where: { id: user.id }, data: { name, email } });
  revalidatePath("/profile");
  return { success: true };
}

export type UserBoardDTO = {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  updatedAt: string;
};

export async function getUserBoards(): Promise<UserBoardDTO[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const boards = await prisma.board.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });
  return boards.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description || "",
    ownerId: b.ownerId,
    updatedAt: b.updatedAt.toISOString(),
  }));
}
