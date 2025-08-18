"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Save } from "lucide-react"
import { updateSettings } from "@/actions/settings"

interface NotificationSettingsProps {
  user: {
    settings?: {
      emailNotifications?: boolean
      aiSuggestions?: boolean
    }
  }
}

export function NotificationSettings({ user }: NotificationSettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(user.settings?.emailNotifications ?? true)
  const [aiSuggestions, setAiSuggestions] = useState(user.settings?.aiSuggestions ?? true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData()
    if (emailNotifications) formData.append("emailNotifications", "on")
    if (aiSuggestions) formData.append("aiSuggestions", "on")

    const result = await updateSettings(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess("Settings updated successfully!")
    }

    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications & Preferences
        </CardTitle>
        <CardDescription>Manage your notification preferences and AI features</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for board updates and mentions
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="aiSuggestions">AI Suggestions</Label>
                <p className="text-sm text-muted-foreground">
                  Enable AI-powered suggestions and insights in your boards
                </p>
              </div>
              <Switch
                id="aiSuggestions"
                checked={aiSuggestions}
                onCheckedChange={setAiSuggestions}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
