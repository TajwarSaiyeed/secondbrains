"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  Users,
  UserPlus,
  MessageSquare,
  Check,
  ExternalLink,
  Clock,
} from "lucide-react";
import {
  markNotificationAsRead,
  acceptBoardInvite,
  type NotificationDTO,
} from "@/actions/notifications";
type ActionResult = { success: true; boardId: string } | { error: string };
import { useRouter } from "next/navigation";

interface NotificationListProps {
  notifications: NotificationDTO[];
  onNotificationUpdate?: (notifications: NotificationDTO[]) => void;
}

export function NotificationList({
  notifications,
  onNotificationUpdate,
}: NotificationListProps) {
  const router = useRouter();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "board_invite":
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case "board_joined":
        return <Users className="h-5 w-5 text-green-500" />;
      case "message_mention":
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (processingIds.has(notificationId)) return;
    setProcessingIds((prev) => new Set(prev).add(notificationId));
    try {
      await markNotificationAsRead(notificationId);
      if (onNotificationUpdate) {
        const updated = notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        onNotificationUpdate(updated);
      } else {
        router.refresh();
      }
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleAcceptInvite = async (notificationId: string) => {
    if (processingIds.has(notificationId)) return;
    setProcessingIds((prev) => new Set(prev).add(notificationId));
    try {
      const result: ActionResult = await acceptBoardInvite(notificationId);
      if ("error" in result) {
        alert(result.error);
      } else if (result.success && result.boardId) {
        router.push(`/dashboard/${result.boardId}`);
      }
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleViewBoard = (boardId?: string) => {
    if (boardId) router.push(`/dashboard/${boardId}`);
  };

  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        const isProcessing = processingIds.has(notification.id);
        return (
          <div
            key={notification.id}
            className={`p-4 border rounded-lg transition-colors ${
              notification.read
                ? "bg-background border-border"
                : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">
                      {notification.title}
                      {!notification.read && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          New
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.type === "board_invite" && (
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvite(notification.id)}
                        disabled={isProcessing}
                        className="text-xs"
                      >
                        Accept
                      </Button>
                    )}
                    {typeof notification.data?.boardId === "string" &&
                      notification.type !== "board_invite" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleViewBoard(notification.data?.boardId)
                          }
                          className="text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Board
                        </Button>
                      )}
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={isProcessing}
                        className="text-xs"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
