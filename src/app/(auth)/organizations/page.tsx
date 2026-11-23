import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { OrganizationCatalog } from "@/features/organizations/components/organization_catalog";
import {
  getCandidateProfiles,
  getOrganizations,
} from "@/features/organizations/services/organization_queries";

export const metadata: Metadata = {
  title: "Student Organizations | OrGanap",
  description:
    "Browse recognized student organizations, leadership directories, and their campus event schedules.",
};

export default async function OrganizationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const organizations = await getOrganizations();

  const canCreate =
    user.isSuperuser ||
    user.isStaff ||
    user.permissions.includes("organizations.create");

  const canUpdateAll =
    user.isSuperuser ||
    user.isStaff ||
    user.permissions.includes("organizations.change_all") ||
    user.permissions.includes("organizations.change");

  const canUpdateOwn = user.permissions.includes("organizations.change_own");

  const canDelete =
    user.isSuperuser ||
    user.isStaff ||
    user.permissions.includes("organizations.delete");

  const candidates = canCreate ? await getCandidateProfiles() : [];

  return (
    <OrganizationCatalog
      canCreate={canCreate}
      canDelete={canDelete}
      canUpdateAll={canUpdateAll}
      canUpdateOwn={canUpdateOwn}
      candidates={candidates}
      currentUserId={user.id}
      organizations={organizations}
    />
  );
}
