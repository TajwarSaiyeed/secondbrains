"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { generateAISummary } from "@/actions/board-content"

interface AISummaryCardProps {
  boardId: string
  aiSummary?: {
    id: string
    content: string
    generatedAt: string
    generatedBy: string
  }
}

export function AISummaryCard({ boardId, aiSummary }: AISummaryCardProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")

  async function handleGenerateSummary() {
    setIsGenerating(true)
    setError("")

    const result = await generateAISummary(boardId)

    if (result.error) {
      setError(result.error)
    }

    setIsGenerating(false)
  }

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
            className="gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : aiSummary ? "Regenerate" : "Generate"}
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
            <p className="text-sm whitespace-pre-wrap">{aiSummary.content}</p>
            <p className="text-xs text-muted-foreground">
              Generated {formatDistanceToNow(new Date(aiSummary.generatedAt), { addSuffix: true })}
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              Generate an AI summary of all notes and links in this board
            </p>
            <Button onClick={handleGenerateSummary} disabled={isGenerating} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Summary"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
