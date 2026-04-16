'use client'

import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Sparkles, Calendar, MessageSquare, Loader2 } from 'lucide-react'
import { sendInngestEventFromClient } from '@/lib/inngest-client'

interface SummarizeDialogProps {
  boardId: string
}

export function SummarizeDialog({ boardId }: SummarizeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const triggerSummary = useAction(api.inngestTrigger.triggerDiscussionSummary)
  const [summaryType, setSummaryType] = useState<'days' | 'dateRange'>('days')
  const [days, setDays] = useState(2)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleSubmit = async () => {
    if (!boardId) return

    setLoading(true)

    const eventData = {
      boardId: boardId,
      timeframe: summaryType,
      days: summaryType === 'days' ? days : undefined,
      startDate: summaryType === 'dateRange' ? startDate : undefined,
      endDate: summaryType === 'dateRange' ? endDate : undefined,
    }

    try {
      await triggerSummary({
        boardId: boardId as any,
        timeframe: summaryType,
        days: summaryType === 'days' ? days : undefined,
        startDate: summaryType === 'dateRange' ? startDate : undefined,
        endDate: summaryType === 'dateRange' ? endDate : undefined,
      })
      setOpen(false)
    } catch (error) {
      // Fallback: send via local proxy (works in local dev)
      try {
        await sendInngestEventFromClient(
          'board/discussion.summarize',
          eventData,
        )
        setOpen(false)
      } catch (proxyErr) {
        console.error('Error summarizing discussion:', proxyErr)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="dark:border-gray-700 dark:text-white dark:hover:text-gray-700"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Summarize Discussion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Discussion Summary
          </DialogTitle>
          <DialogDescription>
            Generate an AI-powered summary of the discussion messages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Summary timeframe</Label>
            <div className="flex gap-2">
              <Button
                variant={summaryType === 'days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSummaryType('days')}
                className="gap-1 dark:border-gray-700 dark:text-white dark:hover:text-gray-700"
              >
                <Calendar className="mr-1 h-4 w-4" />
                Last X Days
              </Button>
              <Button
                variant={summaryType === 'dateRange' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSummaryType('dateRange')}
                className="gap-1 dark:border-gray-700 dark:text-white dark:hover:text-gray-700"
              >
                <MessageSquare className="mr-1 h-4 w-4" />
                Date Range
              </Button>
            </div>
          </div>

          {summaryType === 'days' && (
            <div className="space-y-2">
              <Label htmlFor="days">Number of days</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                placeholder="e.g., 7"
              />
              <p className="text-muted-foreground text-xs">
                Summarize messages from the last {days} day
                {days !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {summaryType === 'dateRange' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date (optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Leave dates empty to include all messages
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="cursor-pointer dark:text-white dark:hover:border-rose-500 dark:hover:bg-transparent dark:hover:text-rose-500"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Summary
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
