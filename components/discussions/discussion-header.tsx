import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users } from "lucide-react";
import { SummarizeDialog } from "./summarize-dialog";

interface DiscussionHeaderProps {
  board: {
    id: string;
    title: string;
    members: Array<{
      userId: string;
      name: string | null;
      role: string;
    }>;
  };
}

export function DiscussionHeader({ board }: DiscussionHeaderProps) {
  return (
    <div className="border-b border-border p-4 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/${board.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {board.title}
            </h1>
            <p className="text-sm text-muted-foreground">Discussion</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SummarizeDialog boardId={board.id} />
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {board.members.length} members
            </span>
            <Badge variant="secondary" className="ml-2">
              AI Enabled
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
