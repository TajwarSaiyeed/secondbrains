/**
 * Helper to send Inngest events from the frontend.
 * This sends events through the Next.js API proxy, which forwards
 * them to the local Inngest dev server or production Inngest cloud.
 *
 * Use this for local development where Convex cloud can't reach
 * the local Inngest dev server.
 */
export async function sendInngestEventFromClient(
  name: string,
  data: Record<string, any>,
) {
  const res = await fetch('/api/inngest/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Failed to send event: ${errorBody}`)
  }

  return res.json()
}
