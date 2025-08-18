"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Bot } from "lucide-react";
import { sendMessage, askAI } from "@/actions/discussions";

interface MessageInputProps {
  boardId: string;
  onMessageSent?: () => void;
}

export function MessageInput({ boardId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError("");

    const result = await sendMessage(boardId, message);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage("");
      onMessageSent?.();
    }

    setIsLoading(false);
  }

  async function handleAskAI() {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError("");

    const result = await askAI(boardId, message);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage("");
      onMessageSent?.();
    }

    setIsLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }

  return (
    <div className="border-t border-border p-4 bg-background">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSendMessage} className="space-y-3">
        <Textarea
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={isLoading}
          className="resize-none"
        />

        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleAskAI}
            disabled={isLoading || !message.trim()}
            className="gap-2 bg-transparent"
          >
            <Bot className="h-4 w-4" />
            Ask AI
          </Button>

          <Button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
