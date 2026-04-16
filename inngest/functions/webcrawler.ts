import { inngest } from '../client'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'
import { ChatOpenAI } from '@langchain/openai'
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export const fetchAndVectorizeWebpageJob = inngest.createFunction(
  {
    id: 'fetch-and-vectorize-webpage',
    triggers: { event: 'board/link.added' },
  },
  async ({ event, step }: any) => {
    const { url, boardId, authorId, linkId } = event.data

    if (linkId) {
      await step.run('Mark as processing', async () => {
        await convex.mutation(api.links.updateLinkData, {
          linkId,
          status: 'processing',
        })
      })
    }

    try {
      const docs = await step.run(
        'Scrape website content via LangChain',
        async () => {
          const loader = new CheerioWebBaseLoader(url)
          const rawDocs = await loader.load()

          const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
          })
          return await splitter.splitDocuments(rawDocs)
        },
      )

      const summary = await step.run(
        'Summarize content with OpenRouter Gemma',
        async () => {
          const chat = new ChatOpenAI({
            apiKey: process.env.OPENROUTER_API_KEY || 'dummy_to_avoid_crash',
            configuration: {
              baseURL: 'https://openrouter.ai/api/v1',
            },
            modelName: 'google/gemma-4-31b-it:free',
            temperature: 0.2,
          })

          const fullText = docs
            .map((d: any) => d.pageContent)
            .join('\n')
            .substring(0, 15000)
          const response = await chat.invoke([
            [
              'system',
              'You are an intelligent knowledge assistant. Summarize the provided webpage context concisely.',
            ],
            [
              'user',
              `Context: ${fullText}\n\nProvide a detailed and rich summary of the content.`,
            ],
          ])
          return response.content as string
        },
      )

      const embeddingsList = await step.run('Generate Embeddings', async () => {
        const embeddingsEngine = new GoogleGenerativeAIEmbeddings({
          apiKey: process.env.GEMINI_API_KEY,
          model: 'gemini-embedding-001',
        })

        return await embeddingsEngine.embedQuery(summary)
      })

      await step.run('Update existing link or create new one', async () => {
        if (linkId) {
          await convex.mutation(api.links.updateLinkData, {
            linkId,
            scrapedContent: summary,
            embedding: embeddingsList,
            status: 'completed',
          })
        } else {
          await convex.mutation(api.links.insertLinkAction, {
            boardId,
            url,
            title: 'AI Scraped Webpage',
            description: summary,
            authorId,
            embedding: embeddingsList,
          })
        }
      })

      return { success: true, summary, url }
    } catch (error: any) {
      if (linkId) {
        await step.run('Mark as failed', async () => {
          await convex.mutation(api.links.updateLinkData, {
            linkId,
            status: 'failed',
          })
        })
      }
      throw error
    }
  },
)
