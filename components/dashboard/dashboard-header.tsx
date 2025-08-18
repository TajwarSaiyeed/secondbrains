"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brain, LogOut, Bell } from "lucide-react";
import { logoutUser } from "@/actions/auth";
import { getUnreadNotificationCount } from "@/actions/notifications";
import { clientCache } from "@/lib/client-cache";

interface DashboardHeaderProps {
  userName: string;
  initialUnreadCount: number;
}

export function DashboardHeader({
  userName,
  initialUnreadCount,
}: DashboardHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [lastFetch, setLastFetch] = useState(Date.now());

  useEffect(() => {
    let isActive = true;

    const pollNotifications = async () => {
      if (!isActive) return;

      const now = Date.now();
      const cacheKey = "unread-notification-count";

      const cachedCount = clientCache.get<number>(cacheKey);
      if (cachedCount !== null && cachedCount !== undefined) {
        if (cachedCount !== unreadCount) {
          setUnreadCount(cachedCount);
        }
        return;
      }

      const timeSinceLastFetch = now - lastFetch;

      if (timeSinceLastFetch < 5000) return;

      try {
        const count = await getUnreadNotificationCount();
        if (isActive && count !== unreadCount) {
          setUnreadCount(count);
          setLastFetch(now);

          clientCache.set(cacheKey, count, 3000);
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    const interval = setInterval(pollNotifications, 5000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [unreadCount, lastFetch]);

  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">MindMesh</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Welcome, {userName}
          </span>
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
              <span className="sr-only">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </span>
            </Button>
          </Link>
          <ThemeToggle />
          <form action={logoutUser}>
            <Button variant="ghost" size="icon" type="submit">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
