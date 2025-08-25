import Link from "next/link";
import { auth } from "@/auth";
import { Brain, Bell, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutUser } from "@/actions/auth/logout";
import { getUnreadNotificationCount } from "@/actions/notifications";

export default async function Navbar() {
  const session = await auth();
  const isAuthed = !!session?.user;
  const userName = session?.user?.name || "Guest";

  const unreadCount = isAuthed ? await getUnreadNotificationCount() : 0;

  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href={isAuthed ? "/dashboard" : "/"}
          className="flex items-center gap-2"
        >
          <Brain className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">
            SecondBrains
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthed ? (
            <>
              <span className="text-sm text-muted-foreground">
                Welcome, {userName}
              </span>
              <Link href="/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative cursor-pointer"
                >
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
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <User className="h-4 w-4" />
                  <span className="sr-only">Profile</span>
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </Link>
              <ThemeToggle />
              <form action={logoutUser}>
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  className="cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </form>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" className="cursor-pointer">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="cursor-pointer">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
