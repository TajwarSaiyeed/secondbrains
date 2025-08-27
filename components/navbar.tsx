import Link from "next/link";
import { auth } from "@/auth";
import { Brain, Bell, LogOut, Settings, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutUser } from "@/actions/auth/logout";
import { getUnreadNotificationCount } from "@/actions/notifications";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default async function Navbar() {
  const session = await auth();
  const isAuthed = !!session?.user;
  const userName = session?.user?.name || "Guest";
  const unreadCount = isAuthed ? await getUnreadNotificationCount() : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Responsive sizing */}
          <Link
            href={isAuthed ? "/dashboard" : "/"}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              SecondBrains
            </span>
          </Link>

          {/* Desktop Menu - Enhanced responsive breakpoints */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-4">
            {isAuthed ? (
              <>
                <span className="text-sm text-muted-foreground max-w-32 truncate">
                  Welcome, {userName}
                </span>
                <Link href="/notifications">
                  <Button
                    variant="ghost"
                    size="sm"
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
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    <User className="h-4 w-4" />
                    <span className="sr-only">Profile</span>
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </Link>
                <ThemeToggle />
                <form action={logoutUser}>
                  <Button
                    variant="ghost"
                    size="sm"
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
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="cursor-pointer">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Tablet Menu - Show some items on medium screens */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            {isAuthed ? (
              <>
                <Link href="/notifications">
                  <Button
                    variant="ghost"
                    size="sm"
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
                  </Button>
                </Link>
                <ThemeToggle />
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72">
                    <SheetHeader>
                      <SheetTitle className="text-left">Menu</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 flex flex-col gap-3">
                      <span className="text-sm text-muted-foreground px-2">
                        Welcome, {userName}
                      </span>
                      <Link href="/dashboard">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/profile">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Button>
                      </Link>
                      <Link href="/settings">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </Link>
                      <div className="border-t pt-3 mt-3">
                        <form action={logoutUser}>
                          <Button variant="destructive" className="w-full">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                          </Button>
                        </form>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="cursor-pointer">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu - Enhanced for small screens */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-72">
                <SheetHeader>
                  <SheetTitle className="text-left flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    SecondBrains
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-3 px-5">
                  {isAuthed ? (
                    <>
                      <div className="px-2 py-2 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Welcome, {userName}
                        </span>
                      </div>
                      <Link href="/dashboard">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/notifications">
                        <Button
                          variant="ghost"
                          className="w-full justify-between"
                        >
                          <span className="flex items-center">
                            <Bell className="h-4 w-4 mr-2" />
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                      <Link href="/profile">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Button>
                      </Link>
                      <Link href="/settings">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </Link>
                      <div className="flex items-center justify-between px-2 py-2">
                        <span className="text-sm font-medium">Theme</span>
                        <ThemeToggle />
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <form action={logoutUser}>
                          <Button variant="destructive" className="w-full">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                          </Button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between px-2 py-2">
                        <span className="text-sm font-medium">Theme</span>
                        <ThemeToggle />
                      </div>
                      <div className="border-t pt-3 mt-3 space-y-2">
                        <Link href="/login">
                          <Button variant="ghost" className="w-full">
                            Sign in
                          </Button>
                        </Link>
                        <Link href="/register">
                          <Button className="w-full">Get Started</Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
