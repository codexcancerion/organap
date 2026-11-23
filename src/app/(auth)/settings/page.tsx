import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { SettingsWorkspace } from "@/features/settings/components/settings_workspace";
import { getSettingsPageData } from "@/features/settings/services/settings_queries";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure your interface preferences, notifications, and institutional policies.",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getSettingsPageData(user);

  return <SettingsWorkspace data={data} userId={user.id} />;
}
