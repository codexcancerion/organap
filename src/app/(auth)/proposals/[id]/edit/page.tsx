import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getProposalById, getProposalFormData } from "@/features/proposals/services/proposal_queries";
import { ProposalForm } from "@/features/proposals/components/proposal_form";
import { PageHeader } from "@/components/layout/page_header";

export const metadata: Metadata = {
  title: "Edit Proposal | OrGanap",
  description: "Revise and update your event proposal.",
};

export default async function EditProposalPage({
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

  const isEditable =
    proposal.status === "draft" ||
    proposal.status === "returned_by_adviser" ||
    proposal.status === "returned_by_student_affairs";

  if (!isEditable) {
    redirect(`/proposals/${proposal.id}`);
  }

  const { organizations, venues } = await getProposalFormData(user.id);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        description={`Update proposal specifications for "${proposal.title}". Resubmission will route to faculty adviser review.`}
        title="Revise Event Proposal"
      />
      <ProposalForm
        initialData={{
          title: proposal.title,
          organizationId: proposal.organizationId,
          purpose: proposal.purpose,
          activitiesDesc: proposal.activitiesDesc,
          venueId: proposal.venueId,
          startTime: proposal.startTime,
          endTime: proposal.endTime,
          registrationDeadline: proposal.registrationDeadline,
          capacity: proposal.capacity,
        }}
        isRevision={proposal.status !== "draft"}
        organizations={organizations}
        proposalId={proposal.id}
        venues={venues}
      />
    </div>
  );
}
