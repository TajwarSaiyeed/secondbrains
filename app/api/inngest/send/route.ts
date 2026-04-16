import { inngest } from '@/inngest/client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for Convex actions to send Inngest events.
 *
 * Convex actions run on Convex's cloud servers and cannot reach
 * the local Inngest dev server (localhost:8288). This endpoint
 * runs within the Next.js app (which IS local) and forwards
 * the event to Inngest.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, data } = body

    if (!name || !data) {
      return NextResponse.json(
        { error: 'Missing event name or data' },
        { status: 400 },
      )
    }

    await inngest.send({ name, data })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Inngest send proxy error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send event' },
      { status: 500 },
    )
  }
}
