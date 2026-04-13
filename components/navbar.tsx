'use client'

import Link from 'next/link'
import { Brain, Bell, LogOut, Settings, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { GlobalSearch } from '@/components/global-search'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useQuery } from 'convex/react'
import { signOut, useSession } from '@/lib/auth-client'
import { api } from '@/convex/_generated/api'

export default function Navbar() {
  const session = useSession()
  const user = useQuery(api.users.current)

  const isAuthed = user !== null && user !== undefined
  const userName = user?.name || user?.email || 'Guest'
  const unreadCount = useQuery(api.notifications.countUnread) || 0

  return (
    <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Responsive sizing */}
          <Link
            href={isAuthed ? '/dashboard' : '/'}
            className="flex shrink-0 items-center gap-2"
          >
            <Brain className="text-primary h-6 w-6 sm:h-8 sm:w-8" />
            <span className="text-foreground text-lg font-bold sm:text-xl lg:text-2xl">
              SecondBrains
            </span>
          </Link>

          {/* Desktop Menu - Enhanced responsive breakpoints */}
          <div className="hidden items-center gap-2 lg:flex xl:gap-4">
            {isAuthed ? (
              <>
                <GlobalSearch />
                <span className="text-muted-foreground max-w-32 truncate text-sm">
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
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void signOut()}
                  className="cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </Button>
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
          <div className="hidden items-center gap-2 md:flex lg:hidden">
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
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
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
                      <span className="text-muted-foreground px-2 text-sm">
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
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      <Link href="/settings">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                      <div className="mt-3 border-t pt-3">
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => void signOut()}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
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
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <Brain className="text-primary h-5 w-5" />
                    SecondBrains
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-3 px-5">
                  {isAuthed ? (
                    <>
                      <GlobalSearch />
                      <div className="bg-muted/50 rounded-lg px-2 py-2">
                        <span className="text-muted-foreground text-sm">
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
                            <Bell className="mr-2 h-4 w-4" />
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                      <Link href="/profile">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      <Link href="/settings">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                      <div className="flex items-center justify-between px-2 py-2">
                        <span className="text-sm font-medium">Theme</span>
                        <ThemeToggle />
                      </div>
                      <div className="mt-3 border-t pt-3">
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => void signOut()}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between px-2 py-2">
                        <span className="text-sm font-medium">Theme</span>
                        <ThemeToggle />
                      </div>
                      <div className="mt-3 space-y-2 border-t pt-3">
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
  )
}
