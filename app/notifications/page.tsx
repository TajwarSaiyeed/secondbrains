import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications } from "@/actions/notifications";
import { NotificationsClient } from "@/components/notifications/notifications-client";

async function NotificationsContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const notifications = await getNotifications();

  return <NotificationsClient initialNotifications={notifications} />;
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div>Loading notifications...</div>}>
      <NotificationsContent />
    </Suspense>
  );
}
