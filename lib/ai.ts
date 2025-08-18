import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Please add your Gemini API key to .env.local");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function summarizeContent(content: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Please provide a concise summary of the following study content. 
      Focus on key concepts, main ideas, and important details that would be useful for studying:
      
      ${content}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI summarization error:", error);
    throw new Error("Failed to generate AI summary");
  }
}

export async function answerQuestion(
  context: string,
  question: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Based on the following study materials and context, please answer the question:
      
      Context: ${context}
      
      Question: ${question}
      
      Please provide a helpful, accurate answer based on the provided context.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI question answering error:", error);
    throw new Error("Failed to generate AI response");
  }
}
