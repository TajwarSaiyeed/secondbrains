"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Send, Bot, Globe, FileText } from "lucide-react";
import { sendMessage, askAI, type ActionResult } from "@/actions/discussions";

interface MessageInputProps {
  boardId: string;
  onMessageSent?: () => void;
}

export function MessageInput({ boardId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allowExternalResources, setAllowExternalResources] = useState(false);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError("");

    const result: ActionResult = await sendMessage(boardId, message);

    if ("error" in result) {
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

    const result: ActionResult = await askAI(
      boardId,
      message,
      allowExternalResources
    );

    if ("error" in result) {
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
          <div className="flex items-center gap-4">
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

            <div className="flex items-center gap-2">
              <Switch
                id="external-resources"
                checked={allowExternalResources}
                onCheckedChange={setAllowExternalResources}
                disabled={isLoading}
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
