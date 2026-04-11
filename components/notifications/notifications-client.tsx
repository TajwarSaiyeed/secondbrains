"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationList } from "@/components/notifications/notification-list";
import {
  getNotifications,
  markAllNotificationsAsRead,
  type NotificationDTO,
} from "@/actions/notifications";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import Link from "next/link";

interface NotificationsClientProps {
  initialNotifications: NotificationDTO[];
}

export function NotificationsClient({
  initialNotifications,
}: NotificationsClientProps) {
  const [notifications, setNotifications] =
    useState<NotificationDTO[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(Date.now());

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    let isActive = true;

    const pollNotifications = async () => {
      if (!isActive) return;
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetch;
      if (timeSinceLastFetch < 3000) return;
      try {
        const updated = await getNotifications();
        if (
          isActive &&
          JSON.stringify(updated) !== JSON.stringify(notifications)
        ) {
          setNotifications(updated);
          setLastFetch(now);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    const interval = setInterval(pollNotifications, 3000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [notifications, lastFetch]);

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {isLoading ? "Marking..." : "Mark all as read"}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  No notifications yet
                </h3>
                <p>You&apos;ll see invitations and updates here.</p>
              </div>
            ) : (
              <NotificationList
                notifications={notifications}
                onNotificationUpdate={setNotifications}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
