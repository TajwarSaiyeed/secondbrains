"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Send, Bot, Globe, FileText, Reply, X, Mic, Square } from "lucide-react";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useDiscussionSender } from "@/hooks/useDiscussionSender";

interface MessageInputProps {
  boardId: string;
  onMessageSent?: () => void;
  replyToId?: string;
  replyToName?: string;
  replyToContent?: string;
  onCancelReply?: () => void;
  setTyping?: (typing: boolean) => void;
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
  const [message, setMessage] = useState("");
  const [allowExternalResources, setAllowExternalResources] = useState(false);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (setTyping) {
      setTyping(e.target.value.length > 0);
    }
  };

  const {
    isLoading,
    error: senderError,
    sendTextMessage,
    sendVoiceMessage,
  } = useDiscussionSender({
    boardId,
    replyToId,
    onSuccess: () => {
      setMessage("");
      if (setTyping) setTyping(false);
      onCancelReply?.();
      onMessageSent?.();
    }
  });

  const {
    isRecording,
    toggleRecording,
    error: recordingError
  } = useVoiceRecording(async (audioBlob) => {
    await sendVoiceMessage(audioBlob);
  });

  const error = senderError || recordingError;

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    await sendTextMessage(message);
  }

  async function handleAskAI() {
    if (!message.trim() || isLoading) return;
    // TODO: implement AI logic using askAiMessage from useDiscussionSender when ready
    console.warn("AI asking feature is not yet fully linked here");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="border-t border-border p-4 bg-background">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {replyToId && (
        <div className="flex items-center justify-between bg-muted/30 border-l-2 border-primary px-3 py-2 text-sm text-muted-foreground mb-3 rounded-sm">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <Reply className="w-3 h-3 text-primary shrink-0" />
            <span className="font-semibold text-foreground text-xs shrink-0">
              Replying to {replyToName}:
            </span>
            <span className="truncate max-w-[200px] text-xs opacity-80">
              {replyToContent}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 bg-transparent opacity-50 hover:opacity-100"
            onClick={onCancelReply}
          >
            <X className="w-3 h-3" />
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

        <div className="flex justify-between items-center">
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
                className="dark:border-gray-700 border-primary bg-red-500"
                checked={allowExternalResources}
                onCheckedChange={setAllowExternalResources}
                disabled={isLoading || isRecording}
              />
              <Label
                htmlFor="external-resources"
                className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
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
              variant={isRecording ? "destructive" : "secondary"}
              onClick={toggleRecording}
              disabled={isLoading || allowExternalResources}
              className="gap-2"
              title={isRecording ? "Stop recording..." : "Record voice message"}
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              type="submit"
              disabled={isLoading || isRecording || !message.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading && !isRecording ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
