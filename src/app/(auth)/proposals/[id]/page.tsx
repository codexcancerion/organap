import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getProposalById } from "@/features/proposals/services/proposal_queries";
import { ProposalDetailView } from "@/features/proposals/components/proposal_detail_view";
import { checkVenueConflict } from "@/features/proposals/services/review_services";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const proposal = await getProposalById(id);

  return {
    title: proposal ? `${proposal.title} | Proposals` : "Event Proposal",
  };
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const proposal = await getProposalById(id);

  if (!proposal) {
    notFound();
  }

  let hasConflict = false;

  if (proposal.status === "pending_student_affairs") {
    hasConflict = await checkVenueConflict(
      proposal.venueId,
      proposal.startTime,
      proposal.endTime,
      proposal.id
    );
  }

  const isAuthorOrOfficer = proposal.createdById === user.id;
  const canEndorse = user.isSuperuser || user.permissions.includes("proposals.endorse");
  const canApprove = user.isSuperuser || user.isStaff || user.permissions.includes("proposals.approve");

  return (
    <ProposalDetailView
      canApprove={canApprove}
      canEndorse={canEndorse}
      currentUserId={user.id}
      hasConflict={hasConflict}
      isAuthorOrOfficer={isAuthorOrOfficer}
      isStaff={user.isStaff}
      isSuperuser={user.isSuperuser}
      proposal={proposal}
    />
  );
}
