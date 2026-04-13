import { inngest } from '../client'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'
import { GoogleGenerativeAI } from '@google/generative-ai'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export const summarizeBoardJob = inngest.createFunction(
  {
    id: 'summarize-board',
    triggers: { event: 'ai/summarize-board' },
  },
  async ({ event, step }: any) => {
    const { boardId, userId } = event.data

    const notes = await step.run('Fetch board notes', async () => {
      try {
        const notesList = await convex.query(api.notes.getNotesByBoard, {
          boardId,
        })
        return notesList || []
      } catch (error) {
        console.error('Error fetching notes:', error)
        return []
      }
    })

    const links = await step.run('Fetch board links', async () => {
      try {
        const linksList = await convex.query(api.links.getLinksByBoard, {
          boardId,
        })
        return linksList || []
      } catch (error) {
        console.error('Error fetching links:', error)
        return []
      }
    })

    const summary = await step.run('Generate AI summary', async () => {
      if (notes.length === 0 && links.length === 0) {
        return 'No content available to summarize.'
      }

      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        console.warn('GEMINI_API_KEY not set, skipping summary generation')
        return 'Summary generation not available (API key missing)'
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' })

        // Build context from notes and links
        const notesContext = notes
          .map((n: any) => `Note by ${n.authorName}:\n${n.content}\n---\n`)
          .join('\n')

        const linksContext = links
          .map(
            (l: any) =>
              `Link: ${l.title}\n${l.url}\nDescription: ${l.description || 'No description'}\n---\n`,
          )
          .join('\n')

        const fullContext = `Board Content Summary Request\n\n${notesContext}\n\n${linksContext}`

        const prompt = `You are SecondBrains AI, an intelligent assistant. 
        
Analyze the following board content and create a comprehensive, well-structured summary.

INSTRUCTIONS:
1. Identify main themes and topics
2. Highlight key concepts and important information
3. Show connections between different pieces of content
4. Include specific details from notes and links
5. Format with clear sections using markdown

CONTENT:
${fullContext}

Please provide a detailed, organized summary that captures the essence of this board's content.`

        const response = await model.generateContent(prompt)
        const text = response.response.text()
        return text
      } catch (error) {
        console.error('Error generating summary:', error)
        return `Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    })

    await step.run('Store summary in database', async () => {
      try {
        await convex.mutation(api.ai.storeSummary, {
          boardId,
          content: summary,
          generatedBy: 'gemini-2.0-flash',
        })
      } catch (error) {
        console.error('Error storing summary:', error)
        throw error
      }
    })

    await step.run('Notify board owner', async () => {
      try {
        await convex.mutation(api.notifications.createNotification, {
          userId,
          type: 'board_invite', // Reusing type - can extend schema later
          title: 'Board Summary Generated',
          message: 'Your AI summary has been generated and is ready to view.',
          data: {
            boardId: boardId.toString(),
            type: 'summary_ready',
          },
        })
      } catch (error) {
        console.error('Error creating notification:', error)
      }
    })

    return {
      success: true,
      boardId,
      summaryLength: summary.length,
      contentItems: { notes: notes.length, links: links.length },
    }
  },
)
