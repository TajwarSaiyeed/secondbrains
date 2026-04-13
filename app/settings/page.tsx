import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/actions/profile";
import { ChangePasswordForm } from "../../components/settings/change-password-form";
import { NotificationSettingsForm } from "../../components/settings/notification-settings-form";
import { DangerZone } from "../../components/settings/danger-zone";
import { Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import { TwoFactorSection } from "../../components/settings/two-factor-section";

async function SettingsContent() {
  // Server-side auth check
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login?from=/settings");
  }

  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Update your password and enable two-factor authentication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">Password</h3>
                <ChangePasswordForm />
              </div>
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-3">Two-Factor Authentication</h3>
                <TwoFactorSection />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Control notifications and AI suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettingsForm
                settings={{
                  emailNotifications: !!user.settings?.emailNotifications,
                  aiSuggestions: !!user.settings?.aiSuggestions,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Delete your account and all associated data. This action cannot
                be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DangerZone />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
