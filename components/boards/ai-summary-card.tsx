"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { generateAISummary } from "@/actions/board-content";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";

interface AISummaryCardProps {
  boardId: string;
  aiSummary?: {
    id: string;
    content: string;
    generatedAt: string;
    generatedBy: string;
  };
}

export function AISummaryCard({ boardId, aiSummary }: AISummaryCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  async function handleGenerateSummary() {
    setIsGenerating(true);
    setError("");

    const result = await generateAISummary(boardId);
    if ("error" in result) {
      setError(result.error || "");
    }

    setIsGenerating(false);
  }

  // Check if content is long enough to need accordion
  const isLongContent = aiSummary?.content && aiSummary.content.length > 500;
  const shouldTruncate = isLongContent && !isExpanded;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Summary
          </CardTitle>
          <Button
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            size="sm"
            variant="outline"
            className="gap-2 dark:border-gray-700 dark:text-white dark:hover:text-gray-700"
          >
            <RefreshCw
              className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
            />
            {isGenerating
              ? "Generating..."
              : aiSummary
              ? "Regenerate"
              : "Generate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {aiSummary ? (
          <div className="space-y-3">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <SyntaxHighlighter
                        style={
                          oneDark as NonNullable<
                            SyntaxHighlighterProps["style"]
                          >
                        }
                        language={match[1]}
                        PreTag="div"
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code {...rest} className={className}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {shouldTruncate
                  ? aiSummary.content.slice(0, 500) + "..."
                  : aiSummary.content}
              </ReactMarkdown>
            </div>
            {isLongContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show More
                  </>
                )}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Generated{" "}
              {formatDistanceToNow(new Date(aiSummary.generatedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              Generate a detailed summary of notes, links, and file content in
              this board
            </p>
            <Button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Summary"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
