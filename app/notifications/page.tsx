import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-server";
import { NotificationsClient } from "../../components/notifications/notifications-client";

async function NotificationsContent() {
  // Server-side auth check
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login?from=/notifications");
  }

  return <NotificationsClient />;
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotificationsContent />
    </Suspense>
  );
}
