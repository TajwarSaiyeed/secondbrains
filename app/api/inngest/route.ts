import { inngest } from '@/inngest/client'
import { fetchAndVectorizeWebpageJob } from '@/inngest/functions/webcrawler'
import { summarizeBoardJob } from '@/inngest/functions/summarize-board'
import { sendInviteEmailJob } from '@/inngest/functions/send-invite-email'
import { serve } from 'inngest/next'

export const maxDuration = 60

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    fetchAndVectorizeWebpageJob,
    summarizeBoardJob,
    sendInviteEmailJob,
  ],
})
