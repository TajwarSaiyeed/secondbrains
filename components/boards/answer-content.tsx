"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

interface AnswerContentProps {
  content?: string | null;
  truncateAt?: number;
}

export default function AnswerContent({
  content,
  truncateAt = 500,
}: AnswerContentProps) {
  const text = content || "";
  const isLong = text.length > truncateAt;
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) {
    return <span className="text-muted-foreground">(message unavailable)</span>;
  }

  const shown =
    isLong && !isExpanded ? text.substring(0, truncateAt) + "..." : text;

  return (
    <div>
      <div className="prose prose-sm max-w-none mb-2">
        <ReactMarkdown>{shown}</ReactMarkdown>
      </div>
      {isLong && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setIsExpanded((s) => !s)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
}
