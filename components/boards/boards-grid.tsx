"use client";

import { useState, useEffect } from "react";
import { BoardCard } from "@/components/boards/board-card";
import { getBoards } from "@/actions/boards";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { Brain } from "lucide-react";

import type { BoardSummaryDTO } from "@/actions/boards";
type Board = BoardSummaryDTO;

interface BoardsGridProps {
  initialBoards: Board[];
  currentUserId: string;
}

export function BoardsGrid({ initialBoards, currentUserId }: BoardsGridProps) {
  const [boards, setBoards] = useState<Board[]>(initialBoards || []);
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [boardCount, setBoardCount] = useState(initialBoards?.length || 0);

  useEffect(() => {
    let isActive = true;

    const pollBoards = async () => {
      if (!isActive) return;

      const now = Date.now();
      const timeSinceLastFetch = now - lastFetch;

      if (timeSinceLastFetch < 10000) return;

      try {
        const updatedBoards: Board[] = await getBoards();

        if (isActive && updatedBoards.length !== boardCount) {
          setBoards(updatedBoards);
          setBoardCount(updatedBoards.length);
          setLastFetch(now);
        }
      } catch (error) {
        console.error("Error fetching boards:", error);
      }
    };

    const interval = setInterval(pollBoards, 10000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [boardCount, lastFetch]);

  if (boards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
          <Brain className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No boards yet
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Create your first study board to start collaborating and organizing
          your research materials.
        </p>
        <CreateBoardDialog />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
