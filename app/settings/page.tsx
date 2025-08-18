import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { getUser } from "@/actions/profile"
import { ChangePasswordForm } from "@/components/settings/change-password-form"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { DangerZone } from "@/components/settings/danger-zone"
import { ThemeToggle } from "@/components/theme-toggle"
import { Brain, ArrowLeft, User, LogOut } from "lucide-react"
import { logoutUser } from "@/actions/auth"

async function SettingsContent() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
  }

  const user = await getUser()
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
              <Link href="/profile">
                <User className="h-4 w-4" />
                Profile
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          {/* Change Password */}
          <ChangePasswordForm />

          {/* Notification Settings */}
          <NotificationSettings user={user} />

          {/* Danger Zone */}
          <DangerZone />
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  )
}
