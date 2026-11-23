import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { DepartmentCatalog } from "@/features/departments/components/department_catalog";
import { getDepartments } from "@/features/departments/services/department_queries";

export const metadata: Metadata = {
  title: "Academic Departments | OrGanap",
  description:
    "Browse and manage academic departments, acronym codes, and affiliated programs.",
};

export default async function DepartmentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canView =
    user.isSuperuser || user.permissions.includes("departments.view");

  if (!canView) {
    redirect("/dashboard");
  }

  const departments = await getDepartments();

  return (
    <DepartmentCatalog
      departments={departments}
      permissions={{
        canView,
        canCreate:
          user.isSuperuser || user.permissions.includes("departments.create"),
        canChange:
          user.isSuperuser || user.permissions.includes("departments.change"),
        canDelete:
          user.isSuperuser || user.permissions.includes("departments.delete"),
        canViewPrograms:
          user.isSuperuser || user.permissions.includes("programs.view"),
      }}
    />
  );
}
