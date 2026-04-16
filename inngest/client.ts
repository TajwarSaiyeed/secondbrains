import { Inngest } from 'inngest'

const isDev = process.env.NODE_ENV !== 'production'

export const inngest = new Inngest({
  id: 'secondbrains-app',
  ...(isDev
    ? {
        isDev: true,
        baseUrl: 'http://localhost:8288',
      }
    : {
        eventKey: process.env.INNGEST_EVENT_KEY,
      }),
})
