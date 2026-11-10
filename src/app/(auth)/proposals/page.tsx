import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getProposals } from "@/features/proposals/services/proposal_queries";
import { ProposalList } from "@/features/proposals/components/proposal_list";

export const metadata: Metadata = {
  title: "Event Proposals | OrGanap",
  description: "Track, submit, and review student organization event activity proposals.",
};

export default async function ProposalsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const proposals = await getProposals();
  const canCreate =
    user.isSuperuser ||
    user.isStaff ||
    user.permissions.includes("proposals.create");

  return <ProposalList canCreate={canCreate} proposals={proposals} />;
}
