import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getAdminGroups, getAllPermissions } from "@/features/groups/services/group_queries";
import { GroupList } from "@/features/groups/components/group_list";

export const metadata: Metadata = {
  title: "Groups & Permissions | OrGanap",
  description: "Configure dynamic campus groups and granular authorization matrices.",
};

export default async function AdminGroupsPage() {
  const user = await getCurrentUser();

  if (
    !user ||
    (!user.isSuperuser &&
      !user.isStaff &&
      !user.permissions.includes("groups.manage") &&
      !user.permissions.includes("groups.view"))
  ) {
    redirect("/dashboard");
  }

  const [groups, allPermissions] = await Promise.all([
    getAdminGroups(),
    getAllPermissions(),
  ]);

  return <GroupList allPermissions={allPermissions} groups={groups} />;
}
