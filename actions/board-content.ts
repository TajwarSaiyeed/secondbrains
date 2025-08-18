"use server";

import "server-only";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { summarizeContent } from "@/lib/ai";
import { GridFSBucket } from "mongodb";
import { Readable } from "stream";

export type UploadFilesResult =
  | { success: true; count: number }
  | { error: string };

export async function addNote(boardId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!content.trim()) {
    return { error: "Note content is required" };
  }

  try {
    const db = await getDb();
    const note = {
      id: new ObjectId().toString(),
      content: content.trim(),
      authorId: user._id.toString(),
      authorName: user.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("boards").updateOne(
      {
        _id: new ObjectId(boardId),
        $or: [
          { ownerId: new ObjectId(user._id) },
          { "members.userId": new ObjectId(user._id) },
        ],
      },
      {
        $push: { notes: note },
        $set: { updatedAt: new Date() },
      } as any
    );

    revalidatePath(`/dashboard/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding note:", error);
    return { error: "Failed to add note" };
  }
}

export async function addLink(
  boardId: string,
  url: string,
  title: string,
  description: string
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!url.trim() || !title.trim()) {
    return { error: "URL and title are required" };
  }

  try {
    const db = await getDb();
    const link = {
      id: new ObjectId().toString(),
      url: url.trim(),
      title: title.trim(),
      description: description.trim(),
      authorId: user._id.toString(),
      authorName: user.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("boards").updateOne(
      {
        _id: new ObjectId(boardId),
        $or: [
          { ownerId: new ObjectId(user._id) },
          { "members.userId": new ObjectId(user._id) },
        ],
      },
      {
        $push: { links: link },
        $set: { updatedAt: new Date() },
      } as any
    );

    revalidatePath(`/dashboard/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding link:", error);
    return { error: "Failed to add link" };
  }
}

export async function generateAISummary(boardId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const db = await getDb();
    const board = await db.collection("boards").findOne({
      _id: new ObjectId(boardId),
      $or: [
        { ownerId: new ObjectId(user._id) },
        { "members.userId": new ObjectId(user._id) },
      ],
    });

    if (!board) {
      return { error: "Board not found" };
    }

    const allContent = [
      ...board.notes.map((note: any) => `Note: ${note.content}`),
      ...board.links.map(
        (link: any) => `Link: ${link.title} - ${link.description}`
      ),
    ].join("\n\n");

    if (!allContent.trim()) {
      return { error: "No content to summarize" };
    }

    const summary = await summarizeContent(allContent);

    const aiSummary = {
      id: new ObjectId().toString(),
      content: summary,
      generatedAt: new Date(),
      generatedBy: user._id.toString(),
    };

    await db.collection("boards").updateOne({ _id: new ObjectId(boardId) }, {
      $set: {
        aiSummary,
        updatedAt: new Date(),
      },
    } as any);

    revalidatePath(`/dashboard/${boardId}`);
    return { success: true, summary };
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return { error: "Failed to generate AI summary" };
  }
}

export async function deleteNote(boardId: string, noteId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const db = await getDb();
    await db.collection("boards").updateOne(
      {
        _id: new ObjectId(boardId),
        $or: [
          { ownerId: new ObjectId(user._id) },
          { "members.userId": new ObjectId(user._id) },
        ],
      },
      {
        $pull: { notes: { id: noteId } },
        $set: { updatedAt: new Date() },
      } as any
    );

    revalidatePath(`/dashboard/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting note:", error);
    return { error: "Failed to delete note" };
  }
}

export async function deleteLink(boardId: string, linkId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const db = await getDb();
    await db.collection("boards").updateOne(
      {
        _id: new ObjectId(boardId),
        $or: [
          { ownerId: new ObjectId(user._id) },
          { "members.userId": new ObjectId(user._id) },
        ],
      },
      {
        $pull: { links: { id: linkId } },
        $set: { updatedAt: new Date() },
      } as any
    );

    revalidatePath(`/dashboard/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting link:", error);
    return { error: "Failed to delete link" };
  }
}

function isFileLike(f: unknown): f is File {
  return !!f && typeof (f as File).arrayBuffer === "function";
}

export async function uploadFiles(
  boardId: string,
  formData: FormData
): Promise<UploadFilesResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const incomingFilesUnknown = formData.getAll("files");
  const incomingFiles: File[] = incomingFilesUnknown.filter(
    isFileLike
  ) as File[];
  if (!incomingFiles || incomingFiles.length === 0) {
    return { error: "No files provided" };
  }

  try {
    const db = await getDb();
    const bucket = new GridFSBucket(db, { bucketName: "uploads" });

    const uploadedMeta: Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      uploadedBy: string;
      uploadedAt: string;
    }> = [];

    for (const file of incomingFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const readable = Readable.from(buffer);

      const uploadStream = bucket.openUploadStream(file.name, {
        contentType: file.type,
        metadata: {
          boardId,
          userId: user._id.toString(),
          size: file.size,
        },
      });

      await new Promise<void>((resolve, reject) => {
        uploadStream.on("finish", () => resolve());
        uploadStream.on("error", (err) => reject(err));
        readable.pipe(uploadStream);
      });

      const fileId = (uploadStream as any).id?.toString();
      if (fileId) {
        uploadedMeta.push({
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          uploadedBy: user._id.toString(),
          uploadedAt: new Date().toISOString(),
        });
      }
    }

    if (uploadedMeta.length === 0) {
      return { error: "Failed to process files" };
    }

    await db.collection("boards").updateOne({ _id: new ObjectId(boardId) }, {
      $push: { files: { $each: uploadedMeta } },
      $set: { updatedAt: new Date() },
    } as any);

    revalidatePath(`/dashboard/${boardId}`);
    return { success: true, count: uploadedMeta.length };
  } catch (error) {
    console.error("Error uploading files:", error);
    return { error: "Failed to upload files" };
  }
}

export async function downloadFile(
  fileId: string
): Promise<
  { error: string } | { filename: string; contentType: string; base64: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const db = await getDb();
    const bucket = new GridFSBucket(db, { bucketName: "uploads" });

    const files = await db
      .collection("uploads.files")
      .find({ _id: new ObjectId(fileId) })
      .toArray();
    if (!files || files.length === 0) {
      return { error: "File not found" };
    }
    const doc = files[0] as unknown as {
      filename: string;
      contentType?: string;
    };

    const stream = bucket.openDownloadStream(new ObjectId(fileId));
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      );
      stream.on("end", () => resolve());
      stream.on("error", (err) => reject(err));
    });

    const buffer = Buffer.concat(chunks);
    const base64 = buffer.toString("base64");

    return {
      filename: doc.filename,
      contentType: doc.contentType || "application/octet-stream",
      base64,
    };
  } catch (error) {
    console.error("Error downloading file:", error);
    return { error: "Failed to download file" };
  }
}
