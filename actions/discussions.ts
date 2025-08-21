"use server";

import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResult = { success: true } | { error: string };
export type DiscussionMessage = {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  type: "user" | "ai";
  createdAt: string;
};

export async function getMessages(
  boardId: string
): Promise<DiscussionMessage[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
  });
  if (!board) return [];

  const messages = await prisma.message.findMany({
    where: { boardId },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    authorId: m.authorId,
    authorName: m.authorName,
    type: m.type,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function sendMessage(
  boardId: string,
  content: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (!content.trim()) return { error: "Message content is required" };

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
  });
  if (!board) return { error: "Board not found or access denied" };

  await prisma.message.create({
    data: {
      boardId,
      content,
      authorId: user.id,
      authorName: user.name || user.email || "User",
      type: "user",
    },
  });
  revalidatePath(`/dashboard/${boardId}/discussion`);
  return { success: true };
}

export async function askAI(
  boardId: string,
  prompt: string,
  allowExternalResources: boolean = false
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (!prompt.trim()) return { error: "Prompt is required" };

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    include: {
      notes: true,
      links: true,
      files: {
        select: {
          id: true,
          name: true,
          type: true,
          extractedContent: true,
          uploadedAt: true,
        },
      },
    },
  });
  if (!board) return { error: "Board not found or access denied" };

  // Get recent messages for context
  const recentMessages = await prisma.message.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Build comprehensive context including extracted file content
  const contextParts = [
    `Board: ${board.title}`,
    `Description: ${board.description || ""}`,
  ];

  // Add notes
  if (board.notes.length > 0) {
    contextParts.push("=== NOTES ===");
    board.notes.forEach((note) => {
      contextParts.push(`Note: ${note.content}`);
    });
  }

  // Add links with descriptions
  if (board.links.length > 0) {
    contextParts.push("=== LINKS ===");
    board.links.forEach((link) => {
      contextParts.push(
        `Link: ${link.title} - ${link.description} (${link.url})`
      );
    });
  }

  // Add extracted content from files
  if (board.files.length > 0) {
    contextParts.push("=== FILES AND EXTRACTED CONTENT ===");
    board.files.forEach((file) => {
      if (file.extractedContent) {
        contextParts.push(`File: ${file.name} (${file.type})`);
        contextParts.push(`Content: ${file.extractedContent}`);
        contextParts.push("---");
      } else {
        contextParts.push(
          `File: ${file.name} (${file.type}) - No extracted content available`
        );
      }
    });
  }

  // Add recent conversation context
  if (recentMessages.length > 0) {
    contextParts.push("=== RECENT CONVERSATION ===");
    recentMessages.reverse().forEach((msg) => {
      contextParts.push(`${msg.authorName}: ${msg.content}`);
    });
  }

  const context = contextParts.join("\n");

  try {
    // First save user message
    await prisma.message.create({
      data: {
        boardId,
        content: prompt.trim(),
        authorId: user.id,
        authorName: user.name || user.email || "User",
        type: "user",
      },
    });

    // Generate AI response
    const aiResponse = await answerQuestion(
      prompt,
      context,
      allowExternalResources
    );

    // Save AI response
    await prisma.message.create({
      data: {
        boardId,
        content: aiResponse,
        authorId: "ai",
        authorName: "MindMesh AI",
        type: "ai",
      },
    });

    revalidatePath(`/dashboard/${boardId}/discussion`);
    return { success: true };
  } catch (error) {
    console.error("Error asking AI:", error);
    return { error: "Failed to get AI response" };
  }
}

async function answerQuestion(
  question: string,
  context: string,
  allowExternalResources: boolean = false
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return "AI responses are currently unavailable. Please configure GEMINI_API_KEY.";
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const restrictionNote = allowExternalResources
      ? "You may use your general knowledge when the context doesn't contain sufficient information."
      : "IMPORTANT: You must ONLY use the information provided in the context below. Do NOT use external knowledge or information not present in the context. If the context doesn't contain enough information to answer the question, clearly state this and explain what information is missing.";

    const prompt = `You are MindMesh AI, an intelligent assistant helping users with their study materials and discussions.

${restrictionNote}

Context from the board:
${context}

User Question: ${question}

Instructions:
- ${
      allowExternalResources
        ? "Primarily use the provided context, but you may supplement with general knowledge if needed"
        : "STRICTLY use only the information provided in the context above"
    }
- Use markdown formatting for better readability (headers, lists, code blocks, etc.)
- If the question asks for code, provide it in proper code blocks with language syntax
- For complex topics, break down your response with clear headings
- ${
      allowExternalResources
        ? "If the context is insufficient, you may provide general guidance"
        : "If the context doesn't contain relevant information, clearly state what specific information is missing from the board content"
    }
- Match your response length to the complexity of the question (short for simple, detailed for complex)
- Use bullet points, numbered lists, and formatting to make information digestible
- When referencing information, mention which source it came from (e.g., "From the uploaded file 'document.pdf':", "From the note:", "From the link:")

Please respond in markdown format:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("AI question answering error:", error);
    return "I apologize, but I'm having trouble generating a response right now. Please try again in a moment.";
  }
}

export async function deleteMessage(
  boardId: string,
  messageId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const message = await prisma.message.findFirst({
    where: { id: messageId, boardId },
  });
  if (!message) return { error: "Message not found" };

  const board = await prisma.board.findFirst({ where: { id: boardId } });
  if (!board) return { error: "Board not found" };

  const canDelete = message.authorId === user.id || board.ownerId === user.id;
  if (!canDelete) return { error: "Permission denied" };

  await prisma.message.delete({ where: { id: messageId } });
  revalidatePath(`/dashboard/${boardId}/discussion`);
  return { success: true };
}

export async function summarizeDiscussion(
  boardId: string,
  options: {
    days?: number;
    startDate?: string;
    endDate?: string;
    messageIds?: string[];
  } = {}
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
  });
  if (!board) return { error: "Board not found or access denied" };

  const where: {
    boardId: string;
    id?: { in: string[] };
    createdAt?: { gte?: Date; lte?: Date };
  } = { boardId };
  if (options.messageIds && options.messageIds.length > 0) {
    where.id = { in: options.messageIds };
  } else if (options.days && options.days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - options.days);
    where.createdAt = { gte: since };
  } else if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) where.createdAt.gte = new Date(options.startDate);
    if (options.endDate) where.createdAt.lte = new Date(options.endDate);
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });
  if (messages.length === 0)
    return { error: "No messages found for the specified criteria" };

  try {
    const messageText = messages
      .map(
        (m) => `${m.authorName} (${m.createdAt.toLocaleString()}): ${m.content}`
      )
      .join("\n");

    const summaryHeader = options.days
      ? `last ${options.days} days`
      : options.startDate || options.endDate
      ? `selected date range`
      : `entire discussion`;

    const aiSummary = await generateDiscussionSummary(
      messageText,
      summaryHeader
    );

    await prisma.message.create({
      data: {
        boardId,
        content: aiSummary,
        authorId: "ai",
        authorName: "MindMesh AI",
        type: "ai",
      },
    });
    revalidatePath(`/dashboard/${boardId}/discussion`);
    return { success: true };
  } catch (error) {
    console.error("Error generating discussion summary:", error);
    return { error: "Failed to generate discussion summary" };
  }
}

async function generateDiscussionSummary(
  messageText: string,
  timeFrame: string
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return `## Discussion Summary (${timeFrame})\n\nAI summaries are currently unavailable. Please configure GEMINI_API_KEY.`;
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Please analyze and summarize the following discussion messages. Create a comprehensive summary in markdown format.

Discussion Messages:
${messageText}

Please provide a structured summary that includes:

1. **Key Topics Discussed** - Main themes and subjects covered
2. **Important Decisions** - Any decisions made or conclusions reached
3. **Action Items** - Tasks or follow-ups mentioned
4. **Questions Raised** - Unresolved questions or areas needing clarification
5. **Participants** - Who contributed to the discussion
6. **Timeline** - When key events or discussions happened

Use markdown formatting with:
- Clear headings (##, ###)
- Bullet points for lists
- **Bold** for emphasis
- Code blocks if technical discussions occurred
- Tables if data was discussed

Title the summary: "## Discussion Summary (${timeFrame})"

Focus on extracting actionable insights and maintaining context for future reference.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Discussion summary generation error:", error);
    return `## Discussion Summary (${timeFrame})\n\nI apologize, but I'm having trouble generating a summary right now. Please try again in a moment.`;
  }
}
