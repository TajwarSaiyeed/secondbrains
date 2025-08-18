"use server";

import "server-only";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";
import { createSession } from "@/lib/redis";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !email || !password || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  try {
    const db = await getDb();

    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    const hashedPassword = await hashPassword(password);
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const sessionId = await createSession(result.insertedId.toString());
    await setSessionCookie(sessionId);
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Failed to create account" };
  }

  redirect("/dashboard");
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ email });

    if (!user || !(await verifyPassword(password, user.password))) {
      return { error: "Invalid email or password" };
    }

    const sessionId = await createSession(user._id.toString());
    await setSessionCookie(sessionId);
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Failed to log in" };
  }

  redirect("/dashboard");
}

export async function logoutUser() {
  await clearSessionCookie();
  redirect("/");
}

export async function clearUserSession() {
  await clearSessionCookie();
  return { success: true };
}
