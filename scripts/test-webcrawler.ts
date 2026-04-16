import { ChatOpenAI } from '@langchain/openai'
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import * as fs from 'fs'
import * as path from 'path'

// Try to load local env vars from Next.js defaults

async function main() {
  const url =
    'https://www.geeksforgeeks.org/software-engineering/software-engineering-requirements-engineering-process/'
  console.log(`Starting extraction process for: ${url}`)

  console.log('1. Scraping website content via LangChain...')
  const loader = new CheerioWebBaseLoader(url)
  const rawDocs = await loader.load()

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  })
  const docs = await splitter.splitDocuments(rawDocs)
  console.log(`-> Loaded ${docs.length} document chunks.`)

  console.log('2. Summarizing content with OpenRouter Gemma...')
  const chat = new ChatOpenAI({
    apiKey: '',
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
    },
    modelName: 'google/gemma-4-31b-it:free:free',
    temperature: 0.5,
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

  const summary = response.content as string
  console.log('-> Summary retrieved successfully.')

  console.log('3. Generating Embeddings...')
  const embeddingsEngine = new GoogleGenerativeAIEmbeddings({
    apiKey: '',
    model: 'gemini-embedding-001',
  })

  const embeddingsList = await embeddingsEngine.embedQuery(summary)
  console.log(`-> Generated ${embeddingsList.length} vector dimensions.`)

  console.log('4. Saving results to scripts/Output.txt...')
  const output = `TARGET URL: ${url}\n\n========== EXTRACTED SUMMARY ==========\n\n${summary}\n\n========== EMBEDDING SAMPLE ==========\n\nLength: ${embeddingsList.length} dimensions\nSample: [${embeddingsList.slice(0, 5).join(', ')}, ...]\n`

  fs.writeFileSync(path.join(__dirname, 'Output.txt'), output)
  console.log('-> Extraction and saving completed!')
}

main().catch(console.error)
