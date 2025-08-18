"use server";

import "server-only";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function getUser(userId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  try {
    const db = await getDb();
    const targetUserId = userId || user._id.toString();

    const userData = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(targetUserId) },
        { projection: { password: 0 } }
      );

    if (!userData) {
      return null;
    }

    return {
      _id: userData._id.toString(),
      name: userData.name || "",
      email: userData.email || "",
      createdAt: userData.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: userData.updatedAt?.toISOString() || new Date().toISOString(),
      settings: userData.settings || {
        emailNotifications: true,
        aiSuggestions: true,
      },
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name || !email) {
    return { error: "Name and email are required" };
  }

  try {
    const db = await getDb();

    const existingUser = await db.collection("users").findOne({
      email,
      _id: { $ne: new ObjectId(user._id) },
    });

    if (existingUser) {
      return { error: "Email is already taken" };
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          name: name.trim(),
          email: email.trim(),
          updatedAt: new Date(),
        },
      }
    );

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }
}

export async function getUserBoards() {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  try {
    const db = await getDb();
    const boards = await db
      .collection("boards")
      .find({
        $or: [
          { ownerId: new ObjectId(user._id) },
          { "members.userId": new ObjectId(user._id) },
        ],
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();

    return boards.map((board) => ({
      _id: board._id.toString(),
      title: board.title || "",
      description: board.description || "",
      ownerId: board.ownerId.toString(),
      updatedAt: board.updatedAt?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching user boards:", error);
    return [];
  }
}
