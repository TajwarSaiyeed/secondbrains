import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'secondbrains-app',
  eventKey: process.env.INNGEST_EVENT_KEY || 'local',
})
