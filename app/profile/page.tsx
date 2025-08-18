import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "@/lib/auth"
import { getUser, getUserBoards } from "@/actions/profile"
import { ProfileEditForm } from "@/components/profile/profile-edit-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { Brain, ArrowLeft, Settings, Calendar, FileText, LogOut } from "lucide-react"
import { logoutUser } from "@/actions/auth"
import { formatDistanceToNow } from "date-fns"

async function ProfileContent() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
  }

  const user = await getUser()
  const recentBoards = await getUserBoards()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">MindMesh</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="gap-2 bg-transparent">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
            <ThemeToggle />
            <form action={logoutUser}>
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
              <p className="text-muted-foreground">Manage your account information and preferences</p>
            </div>

            <ProfileEditForm user={user} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Account Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Member since</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Active boards</p>
                    <p className="text-xs text-muted-foreground">{recentBoards.length} boards</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Boards */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Boards</CardTitle>
                <CardDescription>Your most recently updated boards</CardDescription>
              </CardHeader>
              <CardContent>
                {recentBoards.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No boards yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentBoards.map((board) => (
                      <Link
                        key={board._id}
                        href={`/dashboard/${board._id}`}
                        className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{board.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                          {board.ownerId === user._id && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Owner
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  )
}
