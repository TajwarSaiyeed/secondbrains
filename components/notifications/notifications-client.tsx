'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NotificationList } from '@/components/notifications/notification-list'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { BreadcrumbNav } from '@/components/breadcrumb-nav'

export function NotificationsClient() {
  const notifications = useQuery(api.notifications.getNotifications)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)

  const isLoading = notifications === undefined
  const unreadCount = notifications?.filter((n) => !n.read).length || 0

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl p-6">
        <BreadcrumbNav
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Notifications', isCurrent: true },
          ]}
        />

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bell className="text-primary h-6 w-6" />
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
        <div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
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
            {isLoading ? (
              <div className="text-muted-foreground flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                <Bell className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <h3 className="mb-2 text-lg font-medium">
                  No notifications yet
                </h3>
                <p>You&apos;ll see invitations and updates here.</p>
              </div>
            ) : (
              <NotificationList notifications={notifications} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
