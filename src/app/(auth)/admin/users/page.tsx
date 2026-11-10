import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getAdminUsers } from "@/features/users/services/user_queries";
import { getAdminGroups } from "@/features/groups/services/group_queries";
import { UserTable } from "@/features/users/components/user_table";

export const metadata: Metadata = {
  title: "User Management | OrGanap",
  description: "View and manage campus user accounts, staff access, and dynamic group assignments.",
};

export default async function AdminUsersPage() {
  const user = await getCurrentUser();

  if (!user || (!user.isSuperuser && !user.isStaff && !user.permissions.includes("users.manage"))) {
    redirect("/dashboard");
  }

  const [users, allGroups] = await Promise.all([
    getAdminUsers(),
    getAdminGroups(),
  ]);

  return <UserTable allGroups={allGroups} users={users} />;
}
