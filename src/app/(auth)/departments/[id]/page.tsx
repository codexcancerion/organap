import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { DepartmentDetailView } from "@/features/departments/components/department_detail_view";
import { getDepartmentById } from "@/features/departments/services/department_queries";
import { AddDepartmentProgramButton } from "@/features/programs/components/add_department_program_button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const department = await getDepartmentById(id);

  return {
    title: department
      ? `${department.name} (${department.code}) | Departments`
      : "Department | OrGanap",
    description: "Academic department details and affiliated degree programs.",
  };
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canView =
    user.isSuperuser || user.permissions.includes("departments.view");

  if (!canView) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const department = await getDepartmentById(id);

  if (!department) {
    notFound();
  }

  const canCreatePrograms =
    user.isSuperuser || user.permissions.includes("programs.create");

  return (
    <DepartmentDetailView
      department={department}
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
      programsActionSlot={
        canCreatePrograms ? (
          <AddDepartmentProgramButton
            department={{
              id: department.id,
              name: department.name,
              code: department.code,
            }}
          />
        ) : undefined
      }
    />
  );
}
