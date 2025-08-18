import { Redis } from "@upstash/redis";

if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error("Please add your Upstash Redis credentials to .env.local");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

type Session = {
  userId: string;
  createdAt: number;
  expiresAt: number;
};

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const sessionData = {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  await redis.set(`session:${sessionId}`, sessionData, {
    ex: 7 * 24 * 60 * 60,
  });
  return sessionId;
}

export async function getSession(sessionId: string) {
  const raw = await redis.get<Session | string | null>(`session:${sessionId}`);
  if (!raw) return null;

  const session: Session = typeof raw === "string" ? JSON.parse(raw) : raw;

  if (session.expiresAt < Date.now()) {
    await redis.del(`session:${sessionId}`);
    return null;
  }

  return session;
}

export async function deleteSession(sessionId: string) {
  await redis.del(`session:${sessionId}`);
}
