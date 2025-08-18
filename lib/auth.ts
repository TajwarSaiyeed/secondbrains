import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getSession, deleteSession } from "./redis";
import { getDb } from "./db";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (!sessionId) return null;

  const session = await getSession(sessionId);
  if (!session) return null;

  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { password: 0 } }
    );

  return user;
}

export async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (sessionId) {
    await deleteSession(sessionId);
  }

  cookieStore.delete("session");
}
