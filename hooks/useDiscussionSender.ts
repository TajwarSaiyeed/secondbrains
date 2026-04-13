import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/auth-client";

interface UseDiscussionSenderProps {
  boardId: string;
  replyToId?: string;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

export function useDiscussionSender({ boardId, replyToId, onSuccess, onError }: UseDiscussionSenderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const sendMessageMutation = useMutation(api.discussions.sendMessage);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const askAI = useAction(api.ai.chatWithBoard);

  const sendTextMessage = async (messageText: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!messageText.trim()) throw new Error("Message cannot be empty");
      await sendMessageMutation({
        boardId: boardId as Id<"boards">,
        content: messageText.trim(),
        authorName: session?.user?.name || "Unknown User",
        replyToId: replyToId as Id<"messages"> | undefined,
      });
      onSuccess?.();
    } catch (err: any) {
      const e = new Error(err.message || "Failed to send message");
      setError(e.message);
      onError?.(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    setIsLoading(true);
    setError(null);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: audioBlob,
      });
      if (!result.ok) throw new Error("Failed to upload audio");
      const { storageId } = await result.json();

      await sendMessageMutation({
        boardId: boardId as Id<"boards">,
        content: "Voice message",
        authorName: session?.user?.name || "Unknown User",
        replyToId: replyToId as Id<"messages"> | undefined,
        audioStorageId: storageId,
      });
      onSuccess?.();
    } catch (err: any) {
      const e = new Error(err.message || "Failed to send voice message");
      setError(e.message);
      onError?.(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const askAiMessage = async (messageText: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!messageText.trim()) throw new Error("Message cannot be empty");
      const userMessageId = await sendMessageMutation({
        boardId: boardId as Id<"boards">,
        content: messageText.trim(),
        authorName: session?.user?.name || "Unknown User",
        replyToId: replyToId as Id<"messages"> | undefined,
      });

      await askAI({
        boardId: boardId as Id<"boards">,
        message: messageText.trim()
      });
      onSuccess?.();
    } catch (err: any) {
      const e = new Error(err.message || "Failed to ask AI");
      setError(e.message);
      onError?.(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    sendTextMessage,
    sendVoiceMessage,
    askAiMessage
  };
}
