"use client";

import { BoardCard } from "@/components/boards/board-card";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { Brain } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";

export function BoardsGrid() {
  const boards = useQuery(api.boards.listBoards);

  // Quick user fetch if needed to track current user
  // For precise current mapping if logic relies on it
  // Usually Convex board queries resolve the owner matching natively

  if (boards === undefined) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <BoardCard
          key={board._id}
          board={board}
          currentUserId={board.ownerId}
        />
      ))}
    </div>
  );
}
