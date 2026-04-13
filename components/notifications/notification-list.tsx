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
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface NotificationListProps {
  notifications: any[];
}

export function NotificationList({
  notifications,
}: NotificationListProps) {
  const router = useRouter();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const markAsRead = useMutation(api.notifications.markAsRead);
  const acceptInvite = useMutation(api.boards.joinViaInviteToken);

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

  const handleMarkAsRead = async (notificationId: any) => {
    if (processingIds.has(notificationId)) return;
    setProcessingIds((prev) => new Set(prev).add(notificationId));
    try {
      await markAsRead({ notificationId });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleAcceptInvite = async (notificationId: any, token: string) => {
    if (processingIds.has(notificationId)) return;
    setProcessingIds((prev) => new Set(prev).add(notificationId));
    try {
      if (!token) throw new Error("No invite token explicitly found in notification data.");
      await acceptInvite({ token });
      await markAsRead({ notificationId });
      alert("Invite accepted!");
    } catch (e: any) {
      alert(e.message || String(e));
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleViewBoard = (boardId?: string) => {
    if (boardId) router.push(`/board/${boardId}`);
  };

  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        const isProcessing = processingIds.has(notification._id);
        return (
          <div
            key={notification._id}
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
                      {formatDistanceToNow(new Date(notification._creationTime), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.type === "board_invite" && notification.data?.inviteToken && (
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvite(notification._id, notification.data?.inviteToken)}
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
                        onClick={() => handleMarkAsRead(notification._id)}
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
