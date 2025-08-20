"use server";

import mammoth from "mammoth";
import * as XLSX from "xlsx";
import sharp from "sharp";
// No local OCR workers; we use Gemini for image OCR

export interface ExtractedContent {
  text: string;
  metadata?: {
    pages?: number;
    author?: string;
    title?: string;
    subject?: string;
  };
}

type PdfParseResult = {
  text: string;
  numpages: number;
  info?: { Author?: string; Title?: string; Subject?: string } | undefined;
};

export async function extractFileContent(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ExtractedContent> {
  try {
    // Text files
    if (mimeType === "text/plain" || filename.endsWith(".txt")) {
      return {
        text: buffer.toString("utf-8"),
      };
    }

    // PDF files
    if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
      const pdfModule = (await import(
        "pdf-parse/lib/pdf-parse.js"
      )) as unknown as
        | { default?: (buf: Buffer) => Promise<PdfParseResult> }
        | ((buf: Buffer) => Promise<PdfParseResult>);
      const pdfFn =
        typeof pdfModule === "function"
          ? pdfModule
          : (pdfModule.default as (buf: Buffer) => Promise<PdfParseResult>);
      const data = await pdfFn(buffer);
      return {
        text: data.text,
        metadata: {
          pages: data.numpages,
          author: data.info?.Author,
          title: data.info?.Title,
          subject: data.info?.Subject,
        },
      };
    }

    // Word documents (.docx)
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      filename.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: result.value,
      };
    }

    // Excel files
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel" ||
      filename.endsWith(".xlsx") ||
      filename.endsWith(".xls")
    ) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let allText = "";

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_csv(sheet);
        allText += `Sheet: ${sheetName}\n${sheetText}\n\n`;
      });

      return {
        text: allText,
      };
    }

    // Image files - OCR extraction via Google Gemini to avoid bundling worker scripts
    if (
      mimeType.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(filename)
    ) {
      // Preprocess image for better OCR
      const processedBuffer = await sharp(buffer)
        .png()
        .resize({
          width: 2000,
          height: 2000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .sharpen()
        .toBuffer();

      if (!process.env.GEMINI_API_KEY) {
        return {
          text: "[Image OCR unavailable: missing GEMINI_API_KEY]",
        };
      }

      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imagePart = {
        inlineData: {
          mimeType: "image/png",
          data: processedBuffer.toString("base64"),
        },
      } as const;

      const prompt = `Extract all readable text from this image.
Return only the extracted text in plain text, line breaks preserved.`;

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text().trim();

      return { text };
    }

    // For other file types, return empty text
    return {
      text: `[File: ${filename}] - Content extraction not supported for this file type.`,
    };
  } catch (error) {
    console.error("Error extracting file content:", error);
    return {
      text: `[File: ${filename}] - Error extracting content: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// Enhanced AI content extraction using Google AI
export async function extractContentWithAI(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ExtractedContent> {
  try {
    // First try standard extraction
    const standardResult = await extractFileContent(buffer, mimeType, filename);

    // If we got meaningful text, enhance it with AI analysis
    if (standardResult.text.length > 50) {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");

      if (!process.env.GEMINI_API_KEY) {
        return standardResult;
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Analyze and summarize the following document content. Extract key information, main topics, and important details:
        
        Content:
        ${standardResult.text}
        
        Please provide:
        1. A clean, well-formatted version of the text
        2. Key topics and themes
        3. Important information or data points
        4. Any actionable items or conclusions
        
        Format the response as structured text that would be useful for searching and discussions.
      `;

      const result = await model.generateContent(prompt);
      const aiEnhancedText = result.response.text();

      return {
        text: `${standardResult.text}\n\n--- AI Analysis ---\n${aiEnhancedText}`,
        metadata: standardResult.metadata,
      };
    }

    return standardResult;
  } catch (error) {
    console.error("Error in AI content extraction:", error);
    // Fallback to standard extraction
    return extractFileContent(buffer, mimeType, filename);
  }
}
