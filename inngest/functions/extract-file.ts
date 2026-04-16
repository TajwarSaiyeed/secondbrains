'use node'
import { inngest } from '../client'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'
import { ChatOpenAI } from '@langchain/openai'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export const extractFileContentJob = inngest.createFunction(
  {
    id: 'extract-file-content',
    triggers: { event: 'board/file.uploaded' },
  },
  async ({ event, step }: any) => {
    const { fileId, fileUrl, fileName, fileType, boardId, userId } = event.data

    const logEvent = async (status: string, message: string) => {
      await convex.mutation(api.notifications.createExtractionEvent, {
        userId,
        boardId,
        fileId,
        fileName,
        status,
        message,
      })
    }

    await step.run('Update status: Extracting', async () => {
      await convex.mutation(api.files.updateExtractionStatus, {
        fileId,
        status: 'extracting',
        statusMessage: 'Extracting content using AI...',
      })
      await logEvent('extracting', 'Started AI extraction')
    })

    const extractedText = await step.run(
      'Extract text via Multimodal LLM',
      async () => {
        const chat = new ChatOpenAI({
          apiKey: process.env.OPENROUTER_API_KEY || 'dummy',
          configuration: {
            baseURL: 'https://openrouter.ai/api/v1',
          },
          modelName: 'google/gemma-4-31b-it:free',
          temperature: 0.1,
        })

        const response = await chat.invoke([
          [
            'system',
            'You are a high-fidelity document extraction assistant. Extract ALL readable text and structured information from the file provided at the URL. Maintain formatting and structure. If it is an image, describe it in detail and extract text. If it is a PDF/DOCX, provide the full content.',
          ],
          [
            'user',
            `Please extract the content from this file:\nFile Name: ${fileName}\nFile Type: ${fileType}\nFile URL: ${fileUrl}`,
          ],
        ])

        return response.content as string
      },
    )

    await step.run('Save extracted content', async () => {
      await convex.mutation(api.files.updateExtractedContent, {
        fileId,
        content: extractedText,
      })
    })

    await step.run('Update status: Embedding', async () => {
      await convex.mutation(api.files.updateExtractionStatus, {
        fileId,
        status: 'embedding',
        statusMessage: 'Generating vector embeddings...',
      })
      await logEvent('embedding', 'Generating vector embeddings')
    })

    const embedding = await step.run('Generate Embeddings', async () => {
      const embeddingsEngine = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-embedding-001',
      })
      return await embeddingsEngine.embedQuery(extractedText.substring(0, 8192))
    })

    await step.run('Save embedding', async () => {
      await convex.mutation(api.files.saveFileEmbedding, {
        fileId,
        embedding,
      })
    })

    await step.run('Update status: Completed', async () => {
      await convex.mutation(api.files.updateExtractionStatus, {
        fileId,
        status: 'completed',
        statusMessage: 'Extraction and embedding completed',
      })
      await logEvent('completed', 'File processed successfully')
    })

    return {
      success: true,
      fileId,
      fileName,
      charsExtracted: extractedText.length,
    }
  },
)
