import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { ProgramDetailView } from "@/features/programs/components/program_detail_view";
import {
  getDepartmentOptions,
  getProgramById,
} from "@/features/programs/services/program_queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const program = await getProgramById(id);

  return {
    title: program
      ? `${program.name} (${program.code}) | Programs`
      : "Program | OrGanap",
    description: "Academic program profile and parent department mapping.",
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canView = user.isSuperuser || user.permissions.includes("programs.view");

  if (!canView) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const canChange =
    user.isSuperuser || user.permissions.includes("programs.change");

  const [program, departments] = await Promise.all([
    getProgramById(id),
    canChange ? getDepartmentOptions() : Promise.resolve([]),
  ]);

  if (!program) {
    notFound();
  }

  return (
    <ProgramDetailView
      departments={departments}
      permissions={{
        canView,
        canCreate:
          user.isSuperuser || user.permissions.includes("programs.create"),
        canChange,
        canDelete:
          user.isSuperuser || user.permissions.includes("programs.delete"),
        canViewDepartments:
          user.isSuperuser || user.permissions.includes("departments.view"),
      }}
      program={program}
    />
  );
}
