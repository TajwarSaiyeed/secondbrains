'use client'

import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Send, Bot, Globe, FileText, Reply, X, Mic, Square } from 'lucide-react'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'
import { useDiscussionSender } from '@/hooks/useDiscussionSender'

interface MessageInputProps {
  boardId: string
  onMessageSent?: () => void
  replyToId?: string
  replyToName?: string
  replyToContent?: string
  onCancelReply?: () => void
  setTyping?: (typing: boolean) => void
}

export function MessageInput({
  boardId,
  onMessageSent,
  replyToId,
  replyToName,
  replyToContent,
  onCancelReply,
  setTyping,
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [allowExternalResources, setAllowExternalResources] = useState(false)

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (setTyping) {
      setTyping(e.target.value.length > 0)
    }
  }

  const {
    isLoading,
    error: senderError,
    sendTextMessage,
    sendVoiceMessage,
  } = useDiscussionSender({
    boardId,
    replyToId,
    onSuccess: () => {
      setMessage('')
      if (setTyping) setTyping(false)
      onCancelReply?.()
      onMessageSent?.()
    },
  })

  const {
    isRecording,
    toggleRecording,
    error: recordingError,
  } = useVoiceRecording(async (audioBlob) => {
    await sendVoiceMessage(audioBlob)
  })

  const error = senderError || recordingError

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || isLoading) return
    await sendTextMessage(message)
  }

  async function handleAskAI() {
    if (!message.trim() || isLoading) return
    console.warn('AI asking feature is not yet fully linked here')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="border-border bg-background border-t p-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {replyToId && (
        <div className="bg-muted/30 border-primary text-muted-foreground mb-3 flex items-center justify-between rounded-sm border-l-2 px-3 py-2 text-sm">
          <div className="flex items-center gap-2 truncate overflow-hidden">
            <Reply className="text-primary h-3 w-3 shrink-0" />
            <span className="text-foreground shrink-0 text-xs font-semibold">
              Replying to {replyToName}:
            </span>
            <span className="max-w-50 truncate text-xs opacity-80">
              {replyToContent}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 bg-transparent opacity-50 hover:opacity-100"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="space-y-3">
        <Textarea
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={isLoading || isRecording}
          className="resize-none"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleAskAI}
              disabled={isLoading || isRecording || !message.trim()}
              className="gap-2 bg-transparent"
            >
              <Bot className="h-4 w-4" />
              Ask AI
            </Button>

            <div className="flex items-center gap-2">
              <Switch
                id="external-resources"
                className="border-primary bg-red-500 dark:border-gray-700"
                checked={allowExternalResources}
                onCheckedChange={setAllowExternalResources}
                disabled={isLoading || isRecording}
              />
              <Label
                htmlFor="external-resources"
                className="text-muted-foreground flex cursor-pointer items-center gap-1 text-xs"
              >
                {allowExternalResources ? (
                  <>
                    <Globe className="h-3 w-3" />
                    External knowledge
                  </>
                ) : (
                  <>
                    <FileText className="h-3 w-3" />
                    Board content only
                  </>
                )}
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isRecording ? 'destructive' : 'secondary'}
              onClick={toggleRecording}
              disabled={isLoading || allowExternalResources}
              className="gap-2"
              title={isRecording ? 'Stop recording...' : 'Record voice message'}
            >
              {isRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            <Button
              type="submit"
              disabled={isLoading || isRecording || !message.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading && !isRecording ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
