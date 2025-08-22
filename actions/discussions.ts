"use server";

import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function fetchWebpageContent(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("Only HTTP/HTTPS URLs are supported");
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "MindMesh-AI/1.0 (Educational Content Fetcher)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      throw new Error("Content is not HTML");
    }

    const html = await response.text();
    // console.log(
    //   `Successfully fetched content from ${url} - Length: ${html.length} characters`
    // );

    // Enhanced content extraction for educational and research content
    let textContent = html
      // Remove script and style elements completely (including content)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, "")
      // Remove common noise elements
      .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, "")
      .replace(/class="[^"]*ad[^"]*"/gi, "") // Remove ad-related elements
      // Preserve structure for educational content
      .replace(/<\/?(h[1-6])\b[^>]*>/gi, "\n\n### ") // Convert headings with markdown
      .replace(/<\/?(p|div|article|section)\b[^>]*>/gi, "\n\n")
      .replace(/<\/?(li|dt|dd)\b[^>]*>/gi, "\n• ") // Convert list items to bullets
      .replace(/<\/?(ul|ol|dl)\b[^>]*>/gi, "\n")
      .replace(/<\/?(pre|code)\b[^>]*>/gi, "\n```\n") // Preserve code structure
      .replace(/<\/?(blockquote)\b[^>]*>/gi, "\n> ") // Convert quotes
      .replace(/<\/?(strong|b)\b[^>]*>/gi, "**") // Convert bold to markdown
      .replace(/<\/?(em|i)\b[^>]*>/gi, "*") // Convert italic to markdown
      .replace(/<\/?(br|hr)\b[^>]*>/gi, "\n")
      .replace(/<[^>]*>/g, " ") // Remove remaining HTML tags
      // Decode HTML entities
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&hellip;/g, "...")
      // Clean up whitespace and normalize
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n\s*\n/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    // Filter out very short lines and common noise, but keep meaningful content
    const lines = textContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => {
        if (line.length < 3) return false; // Keep very minimal filtering

        // Keep lines with technical/educational indicators (more generic)
        if (
          /\b(function|method|class|example|tutorial|code|syntax|definition|explanation)\b/i.test(
            line
          )
        )
          return true;
        if (/[:=(){}[\];,.]/.test(line)) return true; // Keep lines with code-like syntax
        if (/\b\d+\.\s/.test(line)) return true; // Keep numbered lists
        if (/^[\s]*[•\-\*]\s/.test(line)) return true; // Keep bullet points

        if (line.length < 8) return false; // Filter very short lines after checking special cases

        // Filter out common navigation and footer noise
        if (
          /^(Home|About|Contact|Privacy|Terms|Login|Register|Search|Menu|Subscribe|Follow|Share)$/i.test(
            line
          )
        )
          return false;
        if (
          /^(Copyright|©|\d{4}|All rights reserved|Terms of Service|Privacy Policy)$/i.test(
            line
          )
        )
          return false;
        if (/^(Next|Previous|Back|Continue|Submit|Cancel|Close)$/i.test(line))
          return false;

        return true;
      });

    textContent = lines.join("\n");

    // Return meaningful content or indicate failure
    if (textContent.length < 100) {
      // console.log(
      //   `Extracted content too short from ${url}: ${textContent.length} characters`
      // );
      return "";
    }

    // console.log(
    //   `Successfully extracted ${textContent.length} characters from ${url}`
    // );
    return textContent;
  } catch (error) {
    // console.error(`Error fetching content from ${url}:`, error);
    throw error;
  }
}

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
    select: {
      id: true,
      title: true,
      description: true,
      filesData: true,
      linksData: true,
      notesData: true,
    },
  });
  if (!board) return { error: "Board not found or access denied" };

  // Get recent messages for context (increased to 25 for better conversation memory)
  const recentMessages = await prisma.message.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  // Build comprehensive context using JSON data (faster and more complete)
  const contextParts = [
    `Board: ${board.title}`,
    `Description: ${board.description || ""}`,
  ];

  // Add notes from JSON data
  const notesData = (board.notesData as any[]) || [];
  if (notesData.length > 0) {
    contextParts.push("=== NOTES ===");
    notesData.forEach((note) => {
      contextParts.push(`Note by ${note.authorName}: ${note.content}`);
    });
  }

  // Add links with fetched content from JSON data
  const linksData = (board.linksData as any[]) || [];
  if (linksData.length > 0) {
    contextParts.push("=== LINKS WITH FETCHED CONTENT ===");
    contextParts.push("(Content fetched from the actual webpages)");

    for (const linkData of linksData) {
      contextParts.push(`\n🔗 LINK: ${linkData.title}`);
      contextParts.push(`📝 Description: ${linkData.description}`);
      contextParts.push(`🌐 URL: ${linkData.url}`);
      contextParts.push(`👤 Added by: ${linkData.addedBy}`);

      if (linkData.fetchedContent && linkData.fetchedContent.length > 50) {
        contextParts.push(`📄 FETCHED CONTENT:`);
        // For educational content, allow much more content to capture complete tutorials
        const maxContentLength = 15000; // Increased from 5000 to capture complete educational content
        const limitedContent =
          linkData.fetchedContent.length > maxContentLength
            ? linkData.fetchedContent.substring(0, maxContentLength) +
              "... [content truncated - for complete content, visit the link directly]"
            : linkData.fetchedContent;
        contextParts.push(limitedContent);
      } else {
        contextParts.push(`❌ Could not fetch readable content from this link`);
      }

      contextParts.push("─".repeat(50));
    }

    contextParts.push("=== END LINKS CONTENT ===");
  }

  // Add extracted content from files using JSON data (faster and more complete)
  const filesData = (board.filesData as any[]) || [];
  if (filesData.length > 0) {
    contextParts.push("=== EXTRACTED CONTENT FROM UPLOADED FILES ===");
    contextParts.push(
      "(This content has been extracted from uploaded PDFs, images, spreadsheets, and documents)"
    );

    const filesWithContent = filesData.filter(
      (fileData) =>
        fileData.extractedContent && fileData.extractedContent.trim()
    );
    const filesWithoutContent = filesData.filter(
      (fileData) =>
        !fileData.extractedContent || !fileData.extractedContent.trim()
    );

    if (filesWithContent.length > 0) {
      contextParts.push("FILES WITH EXTRACTED CONTENT:");
      filesWithContent.forEach((fileData) => {
        contextParts.push(
          `\n📄 FILE: ${fileData.fileName} (${fileData.fileType})`
        );
        contextParts.push(
          `📅 Uploaded: ${new Date(fileData.uploadedAt).toLocaleDateString()}`
        );
        contextParts.push(`👤 Uploaded by: ${fileData.uploadedBy}`);
        contextParts.push(`📊 Size: ${Math.round(fileData.size / 1024)}KB`);
        contextParts.push(`📝 CONTENT:`);
        contextParts.push(fileData.extractedContent);
        contextParts.push("─".repeat(50));
      });
    }

    if (filesWithoutContent.length > 0) {
      contextParts.push("\nFILES WITHOUT EXTRACTED CONTENT:");
      contextParts.push(
        "(These files were uploaded but content extraction failed or is not supported)"
      );
      filesWithoutContent.forEach((fileData) => {
        contextParts.push(
          `📄 ${fileData.fileName} (${fileData.fileType}) - Content extraction failed or not supported for this file type`
        );
      });
      contextParts.push(
        "Note: Consider re-uploading these files or converting them to supported formats (PDF, DOCX, XLSX, TXT, or common image formats)."
      );
    }

    contextParts.push("=== END FILE CONTENT ===");
  }

  // Add recent conversation context with better organization
  if (recentMessages.length > 0) {
    contextParts.push("=== RECENT CONVERSATION ===");
    contextParts.push(
      "(Most recent messages first - use this for conversation continuity)"
    );

    const conversationHistory = recentMessages
      .reverse()
      .map((msg, index) => {
        const timestamp = new Date(msg.createdAt).toLocaleString();
        const messageType = msg.type === "ai" ? "🤖 AI" : "👤 User";
        return `${messageType} ${msg.authorName} [${timestamp}]: ${msg.content}`;
      })
      .join("\n\n");

    contextParts.push(conversationHistory);
    contextParts.push("=== END CONVERSATION HISTORY ===");
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
    // console.error("Error asking AI:", error);
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const restrictionNote = allowExternalResources
      ? "You may use your general knowledge when the context doesn't contain sufficient information."
      : "IMPORTANT: You must ONLY use the information provided in the context below. Do NOT use external knowledge or information not present in the context. If the context doesn't contain enough information to answer the question, clearly state this but also mention what specific information you found and what might be missing from the extracted content.";

    const prompt = `You are MindMesh AI, an intelligent assistant helping users with their study materials and discussions.

${restrictionNote}

Context from the board:
${context}

User Question: ${question}

Instructions for responding:
- ${
      allowExternalResources
        ? "Primarily use the provided context, but you may supplement with general knowledge if needed"
        : "STRICTLY use only the information provided in the context above"
    }
- LINK CONTENT: Pay special attention to "LINKS WITH FETCHED CONTENT" section. This contains actual webpage content from links added to the board - use this information to provide detailed, accurate responses
- CONVERSATION MEMORY: Pay special attention to the "RECENT CONVERSATION" section. Reference previous discussions when relevant to maintain conversation continuity
- If the user refers to something discussed earlier (like "the numpy topic we talked about" or "that user ID you mentioned"), look for it in the recent conversation history
- Use markdown formatting for better readability (headers, lists, code blocks, etc.)
- If the question asks for code, provide it in proper code blocks with language syntax
- For complex topics, break down your response with clear headings
- ${
      allowExternalResources
        ? "If the context is insufficient, you may provide general guidance"
        : "If the context doesn't contain relevant information about the user's question, provide a helpful response that: 1) Clearly states the information is not available in the current board context, 2) Summarizes what content IS available on the board (notes, links, files), 3) Suggests how the user could add the needed information (upload relevant documents, add links to resources, create notes about the topic), 4) If there are unprocessed files, mention that some files may not have been fully processed yet"
    }
- When referencing fetched link content, mention the specific link title and URL (e.g., "According to the tutorial from 'C++ Arrays Guide' (https://example.com):")
- When referencing extracted file content, mention the specific file name and type (e.g., "According to the PDF file 'report.pdf':", "From the Excel file 'data.xlsx':")
- If you find relevant information in fetched web content, prioritize that information as it's specifically chosen by the user for this board
- CONTENT PRIORITY: Use this order of importance: 1) Fetched web content from board links, 2) Extracted file content, 3) Board notes, 4) Conversation history
- If the user asks you to create code or examples based on a tutorial link, use the actual fetched content from that link to provide accurate, up-to-date examples
- If the fetched content seems incomplete or truncated (indicated by "content truncated"), mention this and suggest that the user might need to provide a more specific link or additional resources
- When a user asks about a topic not covered in the board content, be helpful by: 1) Acknowledging the question, 2) Explaining what content is available on the board, 3) Suggesting specific ways they can add relevant information to get better assistance
- If there are files that couldn't be processed (no extracted content), mention this and suggest re-uploading or using different file formats

Please respond in markdown format:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    // console.error("AI question answering error:", error);
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
    // console.error("Error generating discussion summary:", error);
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    // console.error("Discussion summary generation error:", error);
    return `## Discussion Summary (${timeFrame})\n\nI apologize, but I'm having trouble generating a summary right now. Please try again in a moment.`;
  }
}
