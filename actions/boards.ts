"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createNotification } from "@/actions/notifications";
import nodemailer from "nodemailer";
import { randomUUID } from "crypto";

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

  const inviteToken = randomUUID().replace(/-/g, "");
  await prisma.board.update({ where: { id: boardId }, data: { inviteToken } });
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

  async function sendInviteEmail(
    to: string,
    inviterName: string,
    boardTitle: string,
    messageBody: string | undefined,
    inviteLink: string
  ) {
    if (
      !process.env.EMAIL_SERVER_HOST ||
      !process.env.EMAIL_SERVER_USER ||
      !process.env.EMAIL_SERVER_PASSWORD
    ) {
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    try {
      await transporter.verify();
    } catch (err) {
      throw err;
    }

    const html = `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333; text-align: center;">You're Invited to Join a Board</h2>
            <p>Hi there!</p>
            <p><strong>${inviterName}</strong> has invited you to join the board "<strong>${boardTitle}</strong>" on SecondBrains.</p>
            ${
              messageBody
                ? `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0ea5e9;"><p style="margin: 0; font-style: italic; color: #555;">"${messageBody}"</p></div>`
                : ""
            }
            <p>Click the button below to accept the invitation and start collaborating:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Join Board</a>
            </div>
            <p style="color: #666; font-size: 14px;">This invitation link will remain active until the board owner revokes it.</p>
            <p style="color: #666; font-size: 14px;">If you don't want to join this board, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">This invitation was sent from <a href="https://secondbrains.app" style="color: #0ea5e9; text-decoration: none;">SecondBrains</a></p>
          </div>
          `;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.EMAIL_SERVER_USER,
      to,
      subject: `Invitation to join "${boardTitle}" on SecondBrains`,
      html,
    });

    return info;
  }

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

  await Promise.all(
    existingTargets.map(async (u) => {
      try {
        await sendInviteEmail(
          u.email || "",
          user.name || user.email || "Someone",
          board.title,
          message,
          inviteUrl
        );
      } catch {
        // console.error(
        //   "Failed to send invite email to existing user",
        //   u.email,
        //   e
        // );
      }
    })
  );

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

  // Send email invites to pending emails
  await Promise.all(
    pendingEmails.map(async (email) => {
      try {
        await sendInviteEmail(
          email,
          user.name || user.email || "Someone",
          board.title,
          message,
          inviteUrl
        );
      } catch {
        // console.error("Failed to send invite email to pending email", email, e);
      }
    })
  );

  return {
    success: true,
    notified: existingTargets.length,
    pending: pendingEmails.length,
  };
}

export async function claimPendingInvitesByEmail(
  userId: string,
  email?: string | null
) {
  if (!email) return { success: false, added: 0 };
  const normalized = email.trim().toLowerCase();
  const pending = await prisma.pendingInvite.findMany({
    where: { email: normalized },
  });
  if (!pending || pending.length === 0) return { success: true, added: 0 };

  let added = 0;
  for (const p of pending) {
    try {
      const alreadyMember = await prisma.boardMember.findFirst({
        where: { boardId: p.boardId, userId },
      });
      if (alreadyMember) continue;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      await prisma.boardMember.create({
        data: {
          boardId: p.boardId,
          userId,
          name: user?.name ?? "",
          email: normalized,
          role: "member",
          joinedAt: new Date(),
        },
      });
      added++;

      if (p.invitedBy) {
        await createNotification(
          p.invitedBy,
          "board_joined",
          "New team member joined",
          `${normalized} has joined your board`,
          { boardId: p.boardId }
        );
      }
    } catch {
      // console.error("Failed to claim pending invite for", normalized, e);
    }
  }

  // Remove any pending invites for this email
  try {
    await prisma.pendingInvite.deleteMany({ where: { email: normalized } });
  } catch {
    // console.error("Failed to cleanup pending invites for", normalized, e);
  }

  return { success: true, added };
}

export async function claimInviteByToken(userId: string, token: string) {
  const board = await prisma.board.findFirst({ where: { inviteToken: token } });
  if (!board) return { error: "Invalid or expired invite token" };

  try {
    const already = await prisma.boardMember.findFirst({
      where: { boardId: board.id, userId },
    });
    if (!already) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      await prisma.boardMember.create({
        data: {
          boardId: board.id,
          userId,
          name: user?.name ?? "",
          email: user?.email ?? "",
          role: "member",
          joinedAt: new Date(),
        },
      });

      if (board.ownerId) {
        await createNotification(
          board.ownerId,
          "board_joined",
          "New team member joined",
          "A new member joined your board",
          { boardId: board.id }
        );
      }
    }
  } catch {
    // console.error("Failed to claim invite by token", token, e);
    return { error: "Failed to accept invite" };
  }

  return { success: true, boardId: board.id };
}
