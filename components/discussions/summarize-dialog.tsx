"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { summarizeDiscussion, type ActionResult } from "@/actions/discussions";

interface SummarizeDialogProps {
  boardId: string;
}

export function SummarizeDialog({ boardId }: SummarizeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summaryType, setSummaryType] = useState<"days" | "dateRange">("days");
  const [days, setDays] = useState(2);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async () => {
    if (!boardId) return;

    setLoading(true);

    const options: { days?: number; startDate?: string; endDate?: string } = {};

    if (summaryType === "days" && days) {
      options.days = parseInt(days.toString());
    } else if (summaryType === "dateRange" && startDate && endDate) {
      options.startDate = startDate;
      options.endDate = endDate;
    }

    try {
      const result: ActionResult = await summarizeDiscussion(boardId, options);
      if ("error" in result) {
        console.error(result.error);
      } else {
        setOpen(false);
        setDays(2);
        setStartDate("");
        setEndDate("");
        setSummaryType("days");
      }
    } catch (error) {
      console.error("Error summarizing discussion:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
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
                variant={summaryType === "days" ? "default" : "outline"}
                size="sm"
                onClick={() => setSummaryType("days")}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Last X Days
              </Button>
              <Button
                variant={summaryType === "dateRange" ? "default" : "outline"}
                size="sm"
                onClick={() => setSummaryType("dateRange")}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Date Range
              </Button>
            </div>
          </div>

          {summaryType === "days" && (
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
              <p className="text-xs text-muted-foreground">
                Summarize messages from the last {days} day
                {days !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {summaryType === "dateRange" && (
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
              <p className="text-xs text-muted-foreground">
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
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
