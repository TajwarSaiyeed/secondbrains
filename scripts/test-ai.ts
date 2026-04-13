import { GoogleGenerativeAI } from '@google/generative-ai'

async function run() {
  const apiKey = process.env.GEMINI_API_KEY || ''
  const genAI = new GoogleGenerativeAI(apiKey)

  console.log('\n--- Testing Generative Model: gemma-4-31b-it ---')
  try {
    const model = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' })
    const result = await model.generateContent('Say hello in 3 words.')
    console.log('✅ Success! Response:', result.response.text())
  } catch (error: any) {
    console.error('❌ Generative Model Failed:', error.message)
  }

  console.log('\n--- Testing Embedding Model: gemini-embedding-001 ---')
  try {
    const embedModel = genAI.getGenerativeModel({
      model: 'gemini-embedding-001',
    })
    const result = await embedModel.embedContent('This is a test sentence.')
    console.log(
      '✅ Success! Embedding Dimensions:',
      result.embedding.values.length,
    )
  } catch (error: any) {
    console.error('❌ Embedding Model Failed:', error.message)
  }
}

run()
