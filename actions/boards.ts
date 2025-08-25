"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createNotification } from "@/actions/notifications";

export type BoardMemberDTO = {
  userId: string;
  name: string | null;
  email: string | null;
  role: string;
};
export type NoteDTO = {
  id: string;
  content: string;
  authorId: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
};
export type LinkDTO = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  authorId: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
};
export type FileDTO = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: string | null;
  uploadedAt: string;
};
export type AISummaryDTO =
  | { id: string; content: string; generatedAt: string; generatedBy: string }
  | undefined;
export type BoardDTO = {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  members: BoardMemberDTO[];
  notes: NoteDTO[];
  links: LinkDTO[];
  files: FileDTO[];
  updatedAt: string;
  aiSummary?: AISummaryDTO;
};

export type BoardSummaryDTO = {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  members: BoardMemberDTO[];
  notes: Array<{ id: string }>;
  links: Array<{ id: string }>;
  files: Array<{ id: string }>;
  updatedAt: string;
};

export async function getBoards(): Promise<BoardSummaryDTO[]> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const boards = await prisma.board.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      members: true,
      notes: { select: { id: true } },
      links: { select: { id: true } },
      files: { select: { id: true } },
    },
  });

  return boards.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    ownerId: b.ownerId,
    members: b.members.map((m) => ({
      userId: m.userId,
      name: m.name,
      email: m.email,
      role: m.role,
    })),
    notes: b.notes.map((n) => ({ id: n.id })),
    links: b.links.map((l) => ({ id: l.id })),
    files: b.files.map((f) => ({ id: f.id })),
    updatedAt: b.updatedAt.toISOString(),
  }));
}

export async function createBoard(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!title || !description)
    return { error: "Title and description are required" };

  const board = await prisma.board.create({
    data: {
      title,
      description,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: "owner",
        },
      },
    },
  });

  redirect(`/dashboard/${board.id}`);
}

export async function getBoard(boardId: string): Promise<BoardDTO | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    include: {
      members: true,
      notes: true,
      links: true,
      files: true,
      aiSummaries: {
        orderBy: { generatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!board) return null;

  const aiSummary = board.aiSummaries[0]
    ? {
        id: board.aiSummaries[0].id,
        content: board.aiSummaries[0].content,
        generatedAt: board.aiSummaries[0].generatedAt.toISOString(),
        generatedBy: board.aiSummaries[0].generatedBy,
      }
    : undefined;

  return {
    id: board.id,
    title: board.title,
    description: board.description,
    ownerId: board.ownerId,
    members: board.members.map((m) => ({
      userId: m.userId,
      name: m.name,
      email: m.email,
      role: m.role,
    })),
    notes: board.notes.map((n) => ({
      id: n.id,
      content: n.content,
      authorId: n.authorId,
      authorName: n.authorName,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
    links: board.links.map((l) => ({
      id: l.id,
      url: l.url,
      title: l.title,
      description: l.description,
      authorId: l.authorId,
      authorName: l.authorName,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })),
    files: board.files.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      uploadedBy: f.uploadedBy,
      uploadedAt: f.uploadedAt.toISOString(),
    })),
    updatedAt: board.updatedAt.toISOString(),
    aiSummary,
  };
}

export async function deleteBoard(boardId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const res = await prisma.board.deleteMany({
    where: { id: boardId, ownerId: user.id },
  });
  if (res.count === 0) {
    return { error: "Board not found or permission denied" };
  }
  redirect("/dashboard");
}

export async function generateInvite(boardId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const token = crypto.randomUUID().replace(/-/g, "");
  await prisma.board.update({
    where: { id: boardId },
    data: { inviteToken: token },
  });
  const link = `${
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  }/invite/${token}`;
  return { link };
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

  const board = await prisma.board.findFirst({
    where: { id: boardId, ownerId: user.id },
    include: { members: true },
  });
  if (!board) return { error: "Board not found or you don't have permission" };

  const existingUsers = await prisma.user.findMany({
    where: { email: { in: unique } },
  });
  const existingEmails = existingUsers.map((u) =>
    (u.email || "").toLowerCase()
  );
  const pendingEmails = unique.filter(
    (email) => !existingEmails.includes(email)
  );

  const existingTargets = existingUsers.filter(
    (u) => !board.members.some((m) => m.userId === u.id) && u.id !== user.id
  );
  if (existingTargets.length > 0) {
    await Promise.all(
      existingTargets.map((u) =>
        createNotification(
          u.id,
          "board_invite",
          `Invitation to join ${board.title}`,
          `${user.name || user.email || "Someone"} invited you to join "${
            board.title
          }"`,
          { boardId, fromUserId: user.id }
        )
      )
    );
  }

  if (pendingEmails.length > 0) {
    await prisma.pendingInvite.createMany({
      data: pendingEmails.map((email) => ({
        boardId,
        email,
        invitedBy: user.id,
        message,
      })),
      skipDuplicates: true,
    });
  }

  return {
    success: true,
    notified: existingTargets.length,
    pending: pendingEmails.length,
  };
}
