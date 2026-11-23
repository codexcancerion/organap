import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getUnreadNotificationCount } from "@/features/notifications/services/notification_queries";
import { AuthShell } from "@/components/navigation/auth_shell";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <AuthShell unreadCount={unreadCount}>
      <div className="w-full flex flex-col gap-6">
        {children}
      </div>
    </AuthShell>
  );
}
