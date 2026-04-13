"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "model";
  content: string;
  sources?: { id: string; title: string; url: string | null; type: string }[];
};

export function BoardChat({ boardId }: { boardId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content:
        "Hello! I'm integrated with this board's knowledge base. Ask me anything and I'll find the answers for you using the notes, links, and scraped content saved here.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [expandedSources, setExpandedSources] = useState<number | null>(null);

  const sendMessage = useAction(api.ai.chatWithBoard);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to UI
    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      // Send chat context history excluding the very first welcome message and any giant source blocks
      const history = updatedMessages
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await sendMessage({
        boardId: boardId as Id<"boards">,
        message: userMessage,
        history,
      });

      setMessages([
        ...updatedMessages,
        {
          role: "model",
          content: response.text,
          sources: response.sources,
        },
      ]);
    } catch (error) {
      console.error("Chat Failed:", error);
      setMessages([
        ...updatedMessages,
        {
          role: "model",
          content:
            "Sorry, I encountered an error connecting to the AI or retrieving knowledge. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] border-primary/20 shadow-lg">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Board AI Assistant</CardTitle>
            <CardDescription className="text-xs">
              Hybrid Search & cRAG
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden gap-4">
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 pb-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  msg.role === "user" ? "flex-row-reverse" : "",
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 p-2 rounded-full",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 max-w-[85%] text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/50 border rounded-tl-sm space-y-3",
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Render Sources if available */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSources(
                            expandedSources === index ? null : index,
                          )
                        }
                        className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {expandedSources === index ? (
                          <ChevronUp className="w-3 h-3 mr-1" />
                        ) : (
                          <ChevronDown className="w-3 h-3 mr-1" />
                        )}
                        {msg.sources.length} knowledge sources cited
                      </button>

                      {expandedSources === index && (
                        <div className="mt-2 space-y-2">
                          {msg.sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center justify-between p-2 rounded bg-background/50 border text-xs hover:bg-muted transition-colors",
                                !src.url &&
                                  "pointer-events-none cursor-default",
                              )}
                            >
                              <span className="truncate pr-2 font-medium">
                                {src.title}
                              </span>
                              <Badge
                                variant="secondary"
                                className="capitalize text-[10px] shrink-0"
                              >
                                {src.type}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 rounded-full bg-muted">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted/50 border rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 mt-auto pt-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your board..."
            disabled={isTyping}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
          >
            <Send className="w-4 h-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
