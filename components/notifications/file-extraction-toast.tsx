'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface FileExtractionToastProps {
  boardId: string
}

export function FileExtractionToast({ boardId }: FileExtractionToastProps) {
  const boardIdTyped = boardId as Id<'boards'>
  const events = useQuery(api.notifications.getExtractionEvents, {
    boardId: boardIdTyped,
  })

  useEffect(() => {
    if (!events) return

    const latestEvent = events[0]
    if (!latestEvent) return

    const { status, message, fileName } = latestEvent

    switch (status) {
      case 'extracting':
        toast.info(`Extracting ${fileName}...`, {
          id: 'file-extraction',
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
        })
        break
      case 'embedding':
        toast.info(`Embedding ${fileName}...`, {
          id: 'file-extraction',
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
        })
        break
      case 'completed':
        toast.success(`Successfully processed ${fileName}`, {
          id: 'file-extraction',
          icon: <CheckCircle2 className="h-4 w-4" />,
        })
        break
      case 'failed':
        toast.error(`Failed to process ${fileName}: ${message}`, {
          id: 'file-extraction',
          icon: <AlertCircle className="h-4 w-4" />,
        })
        break
    }
  }, [events])

  return null
}
