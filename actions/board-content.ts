"use server";

import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResult = { success: true } | { error: string };

export async function addNote(
  boardId: string,
  content: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (!content.trim()) return { error: "Note content is required" };

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
  });
  if (!board) return { error: "Board not found or access denied" };

  const note = await prisma.note.create({
    data: {
      boardId,
      content,
      authorId: user.id,
      authorName: user.name || user.email || "User",
    },
  });

  // Update board's notes JSON data
  await updateBoardNotesData(boardId, {
    noteId: note.id,
    content: note.content,
    authorId: note.authorId,
    authorName: note.authorName,
    createdAt: note.createdAt.toISOString(),
  });

  revalidatePath(`/dashboard/${boardId}`);
  return { success: true };
}

export async function deleteNote(
  boardId: string,
  noteId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const res = await prisma.note.deleteMany({
    where: { id: noteId, boardId, authorId: user.id },
  });
  if (res.count === 0) return { error: "Note not found or permission denied" };
  revalidatePath(`/dashboard/${boardId}`);
  return { success: true };
}

export async function addLink(
  boardId: string,
  url: string,
  title: string,
  description: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (!url.trim() || !title.trim())
    return { error: "URL and title are required" };

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
  });
  if (!board) return { error: "Board not found or access denied" };

  const link = await prisma.link.create({
    data: {
      boardId,
      url,
      title,
      description: description || "",
      authorId: user.id,
      authorName: user.name || user.email || "User",
    },
  });

  // Fetch content from the link and update JSON data
  try {
    const { fetchWebpageContent } = await import("./discussions");
    const fetchedContent = await fetchWebpageContent(url);

    await updateBoardLinksData(boardId, {
      linkId: link.id,
      url: link.url,
      title: link.title,
      description: link.description,
      fetchedContent: fetchedContent || "",
      addedBy: link.authorName,
      addedAt: link.createdAt.toISOString(),
    });
  } catch (error) {
    await updateBoardLinksData(boardId, {
      linkId: link.id,
      url: link.url,
      title: link.title,
      description: link.description,
      fetchedContent: "",
      addedBy: link.authorName,
      addedAt: link.createdAt.toISOString(),
    });
  }

  revalidatePath(`/dashboard/${boardId}`);
  return { success: true };
}

export async function deleteLink(
  boardId: string,
  linkId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const res = await prisma.link.deleteMany({
    where: { id: linkId, boardId, authorId: user.id },
  });
  if (res.count === 0) return { error: "Link not found or permission denied" };
  revalidatePath(`/dashboard/${boardId}`);
  return { success: true };
}

export type UploadFilesResult =
  | { success: true; count: number }
  | { error: string };

export type FileUploadResult =
  | { success: true; fileId: string; extractedContent?: string }
  | { error: string };

export async function uploadFileWithQueue(
  boardId: string,
  formData: FormData
): Promise<FileUploadResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
  });
  if (!board) return { error: "Board not found or access denied" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file provided" };

  try {
    // Check if Vercel Blob Storage is available
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return {
        error:
          "File upload is not configured. Please set up Vercel Blob Storage or configure BLOB_READ_WRITE_TOKEN environment variable.",
      };
    }

    // Upload to Vercel Blob Storage
    const { put } = await import("@vercel/blob");
    const filename = `${boardId}/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: "public",
      token: blobToken,
    });

    // Create database record
    const record = await prisma.fileMeta.create({
      data: {
        boardId,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        url: blob.url,
        uploadedBy: user.id,
      },
    });

    // Extract content from the uploaded file
    const extractedContent = await extractFileContentFromBlob({
      id: record.id,
      name: file.name,
      type: file.type || "application/octet-stream",
      url: blob.url,
    });

    // Update the record with extracted content
    await prisma.fileMeta.update({
      where: { id: record.id },
      data: { extractedContent: extractedContent?.slice(0, 4000) || null },
    });

    // Update board's files JSON data
    await updateBoardFilesData(boardId, {
      fileId: record.id,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      extractedContent: extractedContent || "",
      uploadedBy: user.name || user.email || "Unknown User",
      uploadedAt: new Date().toISOString(),
      size: file.size,
    });

    revalidatePath(`/dashboard/${boardId}`);
    return {
      success: true,
      fileId: record.id,
      extractedContent: extractedContent?.slice(0, 500),
    };
  } catch (error) {
    console.error("File upload error:", error);
    return { error: "Failed to upload and process file" };
  }
}

export async function uploadFiles(
  boardId: string,
  formData: FormData
): Promise<UploadFilesResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
  });
  if (!board) return { error: "Board not found or access denied" };

  const files = formData.getAll("files");
  if (!files || files.length === 0) return { error: "No files provided" };

  try {
    // Check if Vercel Blob Storage is available
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return {
        error:
          "File upload is not configured. Please set up Vercel Blob Storage or configure BLOB_READ_WRITE_TOKEN environment variable.",
      };
    }

    const { put } = await import("@vercel/blob");

    let saved = 0;
    for (const f of files) {
      if (!(f instanceof File)) continue;

      const filename = `${boardId}/${Date.now()}-${(f as File).name}`;
      const blob = await put(filename, f as File, {
        access: "public",
        token: blobToken,
      });

      await prisma.fileMeta.create({
        data: {
          boardId,
          name: (f as File).name,
          size: (f as File).size,
          type: (f as File).type || "application/octet-stream",
          url: blob.url,
          uploadedBy: user.id,
        },
      });
      saved += 1;
    }
    revalidatePath(`/dashboard/${boardId}`);
    return { success: true, count: saved };
  } catch (error) {
    console.error("File upload error:", error);
    return { error: "Failed to upload files" };
  }
}

export async function downloadFile(
  fileId: string
): Promise<
  { base64: string; contentType: string; filename: string } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const file = await prisma.fileMeta.findFirst({
    where: {
      id: fileId,
      board: {
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      },
    },
  });
  if (!file) return { error: "File not found or access denied" };

  try {
    // Fetch file from Vercel Blob Storage
    const response = await fetch(file.url);
    if (!response.ok) return { error: "File content missing" };

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      base64: buffer.toString("base64"),
      contentType: file.type,
      filename: file.name,
    };
  } catch (error) {
    console.error("Download error:", error);
    return { error: "Failed to download file" };
  }
}

export async function deleteFile(boardId: string, fileId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const file = await prisma.fileMeta.findFirst({
    where: {
      id: fileId,
      boardId,
      board: {
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      },
    },
  });
  if (!file) return { error: "File not found or access denied" };

  try {
    // Delete from Vercel Blob Storage if token is available
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      const { del } = await import("@vercel/blob");
      await del(file.url, { token: blobToken });
    }
  } catch (e) {
    // ignore deletion error from blob storage; continue to remove metadata
    console.warn("Failed to delete file from blob storage:", e);
  }

  await prisma.fileMeta.delete({ where: { id: fileId } });
  revalidatePath(`/dashboard/${boardId}`);
  return { success: true };
}

export async function generateAISummary(
  boardId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    include: { notes: true, links: true, files: true },
  });
  if (!board) return { error: "Board not found or access denied" };

  const lines: string[] = [];
  if (board.notes.length) {
    lines.push(`Notes (${board.notes.length}):`);
    lines.push(
      ...board.notes
        .slice(0, 5)
        .map(
          (n) =>
            `- ${n.content.substring(0, 200)}${
              n.content.length > 200 ? "…" : ""
            }`
        )
    );
  }
  if (board.links.length) {
    lines.push(`Links (${board.links.length}):`);
    lines.push(
      ...board.links.slice(0, 5).map((l) => `- ${l.title} (${l.url})`)
    );
  }
  async function extractFileText(f: {
    id: string;
    name: string;
    type: string;
    boardId: string;
  }) {
    // Use cached extractedContent if available
    const meta = await prisma.fileMeta.findUnique({ where: { id: f.id } });
    if (meta?.extractedContent) return meta.extractedContent;

    // Extract from blob storage
    if (meta?.url) {
      const text = await extractFileContentFromBlob({
        id: f.id,
        name: f.name,
        type: f.type,
        url: meta.url,
      });

      const snippet = text.trim().slice(0, 4000);
      try {
        await prisma.fileMeta.update({
          where: { id: f.id },
          data: { extractedContent: snippet },
        });
      } catch {}
      return snippet;
    }

    return "";
  }

  // Detailed file analysis for better summaries
  const fileDetails: Array<{ name: string; type: string; content: string }> =
    [];
  if (board.files.length) {
    const sample = board.files.slice(0, 5);
    for (const f of sample) {
      const text = await extractFileText({
        id: f.id,
        name: f.name,
        type: f.type,
        boardId,
      });
      if (text && text.length > 10) {
        fileDetails.push({
          name: f.name,
          type: f.type,
          content: text.slice(0, 1000), // More content for AI analysis
        });
      }
    }
  }

  let aggregatedContext = lines.join("\n");
  if (fileDetails.length > 0) {
    const fileLines = [`Files (${board.files.length}):`];
    fileDetails.forEach(({ name, content }) => {
      const snippet = content.replace(/\s+/g, " ").slice(0, 300);
      if (snippet) {
        fileLines.push(
          `- ${name}: ${snippet}${content.length > 300 ? "…" : ""}`
        );
      } else {
        fileLines.push(`- ${name}`);
      }
    });
    aggregatedContext = [aggregatedContext, fileLines.join("\n")]
      .filter(Boolean)
      .join("\n");
  }
  if (!aggregatedContext.trim())
    aggregatedContext = "No content yet to summarize.";

  // Enhanced AI summarization with better prompting
  let finalContent = aggregatedContext;
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Analyze and summarize this board content. Create a structured summary with bullet points.

For each file, mention:
- **File name** and what type of content it contains
- **Key topics** or main points from the content
- **Important details** like problem statements, equations, data, or actionable items

For notes and links, highlight:
- **Main themes** and topics discussed
- **Important information** or conclusions
- **Relationships** between different pieces of content

Content to analyze:
${aggregatedContext}

Format as markdown with clear headings and bullet points. Be concise but specific.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const text = result.response.text();
      if (text && text.trim().length > 0) finalContent = text.trim();
    }
  } catch (error) {
    console.error("AI summarization failed:", error);
    // Keep heuristic summary as fallback
  }

  // Persist the final summary
  await prisma.aISummary.create({
    data: { boardId, content: finalContent, generatedBy: user.id },
  });
  revalidatePath(`/dashboard/${boardId}`);
  return { success: true };
}

// Helper function to extract content from a file stored in Vercel Blob Storage
async function extractFileContentFromBlob(f: {
  id: string;
  name: string;
  type: string;
  url: string;
}): Promise<string> {
  try {
    // Fetch file from Vercel Blob Storage
    const response = await fetch(f.url);
    if (!response.ok) return "";

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = f.name.toLowerCase();
    const mime = f.type || "";
    let text = "";

    try {
      if (mime.startsWith("text/") || ext.endsWith(".txt")) {
        text = buffer.toString("utf8");
      } else if (ext.endsWith(".pdf")) {
        const pdfParse = await import("pdf-parse/lib/pdf-parse.js");
        const pdfFn = (pdfParse as any).default || pdfParse;
        const data = await pdfFn(buffer);
        text = data.text || "";
      } else if (ext.endsWith(".docx") || ext.endsWith(".doc")) {
        const mammoth = await import("mammoth");
        const res = await mammoth.extractRawText({ buffer });
        text = res.value || "";
      } else if (ext.endsWith(".csv")) {
        const Papa = await import("papaparse");
        const csv = buffer.toString("utf8");
        const parsed = Papa.parse(csv, { delimiter: ",", newline: "\n" });
        const rows = (parsed.data as string[][])
          .slice(0, 10)
          .map((r) => r.join(", "))
          .join("\n");
        text = rows;
      } else if (ext.endsWith(".xlsx")) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(buffer, { type: "buffer" });
        const firstSheet = wb.SheetNames[0];
        if (firstSheet) {
          const sheet = wb.Sheets[firstSheet];
          const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          text = (data as string[][])
            .slice(0, 10)
            .map((r) => r.join(", "))
            .join("\n");
        }
      } else if (
        mime.startsWith("image/") ||
        ext.match(/\.(png|jpe?g|gif|bmp|tiff|webp)$/)
      ) {
        // Use Gemini API for OCR
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (apiKey) {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

          const imagePart = {
            inlineData: {
              mimeType: mime.startsWith("image/") ? mime : "image/png",
              data: buffer.toString("base64"),
            },
          };

          const prompt =
            "Extract all readable text from this image. Return only the text content, preserving line breaks.";
          const result = await model.generateContent([prompt, imagePart]);
          text = result.response.text().trim();
        } else {
          text = "[Image OCR unavailable: missing GEMINI_API_KEY]";
        }
      }
    } catch (error) {
      console.error(`Error extracting content from ${f.name}:`, error);
      text = `[Error extracting content from ${f.name}]`;
    }

    return text.trim().slice(0, 8000); // Increased limit for JSON storage
  } catch (error) {
    console.error(`Error fetching file ${f.name} from blob storage:`, error);
    return `[Error fetching file from storage]`;
  }
}

// Helper function to extract content from a file (legacy function - updated to use blob storage)
async function extractFileContent(f: {
  id: string;
  name: string;
  type: string;
  boardId: string;
}): Promise<string> {
  // Get the file URL from database
  const fileMeta = await prisma.fileMeta.findUnique({
    where: { id: f.id },
    select: { url: true },
  });

  if (!fileMeta?.url) return "";

  return extractFileContentFromBlob({
    id: f.id,
    name: f.name,
    type: f.type,
    url: fileMeta.url,
  });
}

// Helper function to update board's files JSON data
async function updateBoardFilesData(
  boardId: string,
  fileData: {
    fileId: string;
    fileName: string;
    fileType: string;
    extractedContent: string;
    uploadedBy: string;
    uploadedAt: string;
    size: number;
  }
) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { filesData: true },
  });

  const currentData = (board?.filesData as any[]) || [];
  const updatedData = [...currentData, fileData];

  await prisma.board.update({
    where: { id: boardId },
    data: { filesData: updatedData },
  });
}

// Helper function to update board's links JSON data
export async function updateBoardLinksData(
  boardId: string,
  linkData: {
    linkId: string;
    url: string;
    title: string;
    description: string;
    fetchedContent: string;
    addedBy: string;
    addedAt: string;
  }
) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { linksData: true },
  });

  const currentData = (board?.linksData as any[]) || [];
  const updatedData = [...currentData, linkData];

  await prisma.board.update({
    where: { id: boardId },
    data: { linksData: updatedData },
  });
}

// Helper function to update board's notes JSON data
export async function updateBoardNotesData(
  boardId: string,
  noteData: {
    noteId: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  }
) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { notesData: true },
  });

  const currentData = (board?.notesData as any[]) || [];
  const updatedData = [...currentData, noteData];

  await prisma.board.update({
    where: { id: boardId },
    data: { notesData: updatedData },
  });
}
