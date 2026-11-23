import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getDashboardMetrics } from "@/features/dashboard/services/dashboard_queries";
import { EmptyDashboard } from "@/features/dashboard/components/empty_dashboard";

export const metadata: Metadata = {
  title: "Dashboard | OrGanap",
  description: "View and manage your student organization proposals and event registrations.",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const metrics = await getDashboardMetrics({
    id: user.id,
    isStaff: user.isStaff,
    isSuperuser: user.isSuperuser,
    permissions: user.permissions,
  });

  return <EmptyDashboard metrics={metrics} user={user} />;
}
