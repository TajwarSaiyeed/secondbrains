"use server";

import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!currentPassword || !newPassword || !confirmPassword)
    return { error: "All fields are required" };
  if (newPassword !== confirmPassword)
    return { error: "New passwords do not match" };
  if (newPassword.length < 8)
    return { error: "New password must be at least 8 characters long" };

  const u = await prisma.user.findUnique({ where: { id: user.id } });
  if (!u || !u.password) return { error: "Current password is incorrect" };

  const ok = await verifyPassword(currentPassword, u.password);
  if (!ok) return { error: "Current password is incorrect" };

  const hashedNew = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNew },
  });
  return { success: true };
}

export async function updateSettings(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  const emailNotifications = formData.get("emailNotifications") === "on";
  const aiSuggestions = formData.get("aiSuggestions") === "on";

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: { emailNotifications, aiSuggestions },
    create: { userId: user.id, emailNotifications, aiSuggestions },
  });
  return { success: true };
}

export async function deleteAccount(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("confirmation") || "");

  if (!password || !confirmation)
    return { error: "Password and confirmation are required" };
  if (confirmation !== "DELETE")
    return { error: "Please type DELETE to confirm" };

  const u = await prisma.user.findUnique({ where: { id: user.id } });
  if (!u || !u.password) return { error: "Password is incorrect" };
  const ok = await verifyPassword(password, u.password);
  if (!ok) return { error: "Password is incorrect" };

  await prisma.board.deleteMany({ where: { ownerId: user.id } });
  await prisma.boardMember.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  revalidatePath("/");
  return { success: true };
}
