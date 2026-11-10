import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getUserNotifications } from "@/features/notifications/services/notification_queries";
import { NotificationList } from "@/features/notifications/components/notification_list";
import { PageHeader } from "@/components/layout/page_header";

export const metadata: Metadata = {
  title: "Notifications | OrGanap",
  description: "Stay updated on event proposals, approvals, registrations, and campus notices.",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const notifications = await getUserNotifications(user.id);

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        description="Stay updated on event proposal reviews, approvals, registrations, and administrative announcements."
        title="Notifications"
      />
      <NotificationList notifications={notifications} />
    </div>
  );
}
