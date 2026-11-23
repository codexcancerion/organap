import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { SemesterCatalog } from "@/features/semesters/components/semester_catalog";
import { getSemesters } from "@/features/semesters/services/semester_queries";

export const metadata: Metadata = {
  title: "Academic Semesters | OrGanap",
  description:
    "Manage academic semesters, descriptions, and start/end calendar dates.",
};

export default async function SemestersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canView = user.isSuperuser || user.permissions.includes("semesters.view");

  if (!canView) {
    redirect("/dashboard");
  }

  const semesters = await getSemesters();

  return (
    <SemesterCatalog
      permissions={{
        canView,
        canCreate: user.isSuperuser || user.permissions.includes("semesters.create"),
        canChange: user.isSuperuser || user.permissions.includes("semesters.change"),
        canDelete: user.isSuperuser || user.permissions.includes("semesters.delete"),
      }}
      semesters={semesters}
    />
  );
}
