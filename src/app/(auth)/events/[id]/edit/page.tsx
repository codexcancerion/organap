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

export default async function EditEventProposalPage({
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
    redirect(`/events/${proposal.id}`);
  }

  const { organizations, venues, semesters, attachmentTypes } = await getProposalFormData(user.id);
  const editableOrganizations = organizations.some((o) => o.id === proposal.organizationId)
    ? organizations
    : [
        {
          id: proposal.organizationId,
          name: proposal.organizationName,
          acronym: proposal.organizationAcronym,
        },
        ...organizations,
      ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        breadcrumbs={[
          { label: "Back to Events", href: "/events" },
          { label: proposal.title, href: `/events/${proposal.id}` },
          { label: "Revise Proposal" },
        ]}
        description={`Update proposal specifications and upload categorized attachments for "${proposal.title}". Resubmission routes to faculty adviser review.`}
        title="Revise Event Proposal"
      />
      <ProposalForm
        attachmentTypes={attachmentTypes}
        currentStatus={proposal.status}
        existingAttachments={proposal.attachments}
        initialData={{
          title: proposal.title,
          organizationId: proposal.organizationId,
          purpose: proposal.purpose,
          activitiesDesc: proposal.activitiesDesc,
          activityType: proposal.activityType,
          semesterId: proposal.semesterId ?? null,
          venueId: proposal.venueId,
          startTime: proposal.startTime,
          endTime: proposal.endTime,
          registrationDeadline: proposal.registrationDeadline,
          capacity: proposal.capacity,
        }}
        isRevision={proposal.status !== "draft"}
        organizations={editableOrganizations}
        proposalId={proposal.id}
        semesters={semesters}
        venues={venues}
      />
    </div>
  );
}
