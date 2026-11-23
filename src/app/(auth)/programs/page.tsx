import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { ProgramCatalog } from "@/features/programs/components/program_catalog";
import {
  getDepartmentOptions,
  getPrograms,
} from "@/features/programs/services/program_queries";

export const metadata: Metadata = {
  title: "Academic Programs | OrGanap",
  description:
    "Browse and manage academic degree programs, acronym codes, and department assignments.",
};

export default async function ProgramsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canView = user.isSuperuser || user.permissions.includes("programs.view");

  if (!canView) {
    redirect("/dashboard");
  }

  const [programs, departments] = await Promise.all([
    getPrograms(),
    getDepartmentOptions(),
  ]);

  return (
    <ProgramCatalog
      departments={departments}
      permissions={{
        canView,
        canCreate:
          user.isSuperuser || user.permissions.includes("programs.create"),
        canChange:
          user.isSuperuser || user.permissions.includes("programs.change"),
        canDelete:
          user.isSuperuser || user.permissions.includes("programs.delete"),
        canViewDepartments:
          user.isSuperuser || user.permissions.includes("departments.view"),
      }}
      programs={programs}
    />
  );
}
