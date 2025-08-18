"use server";

import "server-only";
import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import {
  getCurrentUser,
  hashPassword,
  verifyPassword,
  clearSessionCookie,
} from "@/lib/auth";

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters long" };
  }

  try {
    const db = await getDb();
    const userData = await db
      .collection("users")
      .findOne({ _id: new ObjectId(user._id) });

    if (
      !userData ||
      !(await verifyPassword(currentPassword, userData.password))
    ) {
      return { error: "Current password is incorrect" };
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await db.collection("users").updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { error: "Failed to change password" };
  }
}

export async function updateSettings(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const emailNotifications = formData.get("emailNotifications") === "on";
  const aiSuggestions = formData.get("aiSuggestions") === "on";

  try {
    const db = await getDb();

    await db.collection("users").updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          settings: {
            emailNotifications,
            aiSuggestions,
          },
          updatedAt: new Date(),
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { error: "Failed to update settings" };
  }
}

export async function deleteAccount(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const password = formData.get("password") as string;
  const confirmation = formData.get("confirmation") as string;

  if (!password || !confirmation) {
    return { error: "Password and confirmation are required" };
  }

  if (confirmation !== "DELETE") {
    return { error: "Please type DELETE to confirm" };
  }

  let completed = false;
  try {
    const db = await getDb();
    const userData = await db
      .collection("users")
      .findOne({ _id: new ObjectId(user._id) });

    if (!userData || !(await verifyPassword(password, userData.password))) {
      return { error: "Password is incorrect" };
    }

    await db
      .collection("boards")
      .deleteMany({ ownerId: new ObjectId(user._id) });

    await db
      .collection("boards")
      .updateMany({ "members.userId": new ObjectId(user._id) }, {
        $pull: { members: { userId: new ObjectId(user._id) } },
      } as any);

    await db.collection("users").deleteOne({ _id: new ObjectId(user._id) });

    await clearSessionCookie();
    completed = true;
  } catch (error) {
    console.error("Error deleting account:", error);
    return { error: "Failed to delete account" };
  }

  if (completed) {
    redirect("/");
  }
}
