import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import {
  getOrganizationById,
  getCandidateProfiles,
} from "@/features/organizations/services/organization_queries";
import { OrganizationDetailView } from "@/features/organizations/components/organization_detail_view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const org = await getOrganizationById(id);

  return {
    title: org ? `${org.name} (${org.acronym}) | Organizations` : "Organization",
    description: org?.description ?? "Student Organization Profile",
  };
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const organization = await getOrganizationById(id, user.id, {
    isSuperuser: user.isSuperuser,
    isStaff: user.isStaff,
    permissions: user.permissions,
  });

  if (!organization) {
    notFound();
  }

  // Fetch candidates if user has permissions to edit leadership or add members
  const canManage = organization.permissions.canEditThisOrg;
  const candidates = canManage ? await getCandidateProfiles() : [];

  return (
    <OrganizationDetailView
      candidates={candidates}
      currentUserId={user.id}
      organization={organization}
    />
  );
}
