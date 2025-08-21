import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BoardCardProps {
  board: {
    id: string;
    title: string;
    description: string | null;
    members: Array<{
      userId: string;
      name: string | null;
      email: string | null;
      role: string;
    }>;
    notes: Array<{ id: string }>;
    links: Array<{ id: string }>;
    files: Array<{ id: string }>;
    updatedAt: string;
    ownerId: string;
  };
  currentUserId: string;
}

export function BoardCard({ board, currentUserId }: BoardCardProps) {
  const isOwner = board.ownerId === currentUserId;
  const memberCount = board.members.length;
  const contentCount =
    board.notes.length + board.links.length + board.files.length;

  return (
    <Link href={`/dashboard/${board.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-border">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">
                {board.title}
              </CardTitle>
              {board.description && (
                <CardDescription className="mt-2 line-clamp-3">
                  {board.description}
                </CardDescription>
              )}
            </div>
            {isOwner && (
              <Badge variant="secondary" className="ml-2">
                Owner
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {memberCount} member{memberCount !== 1 ? "s" : ""}
              </span>
              <div className="flex -space-x-1 ml-2">
                {board.members.slice(0, 3).map((member) => (
                  <Avatar
                    key={member.userId}
                    className="h-6 w-6 border-2 border-background"
                  >
                    <AvatarFallback className="text-xs">
                      {(member.name || member.email || "?")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {memberCount > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      +{memberCount - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {contentCount} item{contentCount !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Updated{" "}
                {formatDistanceToNow(new Date(board.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
