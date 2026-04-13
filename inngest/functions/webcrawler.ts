import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { ChatOpenAI } from "@langchain/openai";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const fetchAndVectorizeWebpageJob = inngest.createFunction(
  {
    id: "fetch-and-vectorize-webpage",
    triggers: { event: "board/link.added" },
  },
  async ({ event, step }: any) => {
    const { url, boardId, authorId } = event.data;

    // 1. Scraping Step
    const docs = await step.run(
      "Scrape website content via LangChain",
      async () => {
        const loader = new CheerioWebBaseLoader(url);
        const rawDocs = await loader.load();

        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        return await splitter.splitDocuments(rawDocs);
      },
    );

    // 2. Summarize the content using OpenRouter Gemma model
    const summary = await step.run(
      "Summarize content with OpenRouter Gemma",
      async () => {
        const chat = new ChatOpenAI({
          openAIApiKey: process.env.OPENROUTER_API_KEY,
          configuration: {
            baseURL: "https://openrouter.ai/api/v1",
          },
          modelName: "google/gemma-3-27b-it", // Recommended Gemma 3 27B from OpenRouter
          temperature: 0.2,
        });

        const fullText = docs
          .map((d: any) => d.pageContent)
          .join("\n")
          .substring(0, 15000); // safety cap
        const response = await chat.invoke([
          [
            "system",
            "You are an intelligent knowledge assistant. Summarize the provided webpage context concisely.",
          ],
          [
            "user",
            `Context: ${fullText}\n\nProvide a detailed and rich summary of the content.`,
          ],
        ]);
        return response.content as string;
      },
    );

    // 3. Generate Vector Embeddings
    const embeddingsList = await step.run("Generate Embeddings", async () => {
      const embeddingsEngine = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: "text-embedding-004", // 768 dimensions standard, adjust Convex DB later
      });

      return await embeddingsEngine.embedQuery(summary);
    });

    // 4. Save to Convex Database
    await step.run("Save Link and Vector to Convex DB", async () => {
      // NOTE: Expecting an internal mutation or we can define a new one for AI links
      // For safe insertion inside Inngest, we bypass client auth and use internal token / service role if needed
      await convex.mutation(api.links.insertLinkAction, {
        boardId,
        url,
        title: "AI Scraped Webpage",
        description: summary,
        authorId,
        embedding: embeddingsList,
      });
    });

    return { success: true, summary, url };
  },
);
