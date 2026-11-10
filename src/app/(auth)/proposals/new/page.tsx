import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getProposalFormData } from "@/features/proposals/services/proposal_queries";
import { ProposalForm } from "@/features/proposals/components/proposal_form";
import { PageHeader } from "@/components/layout/page_header";

export const metadata: Metadata = {
  title: "New Event Proposal | OrGanap",
  description: "Draft and submit a new student organization event proposal.",
};

export default async function NewProposalPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { organizations, venues } = await getProposalFormData(user.id);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        description="Fill out event details, reserve a campus venue, and route for two-stage faculty and institutional endorsement."
        title="Draft New Event Proposal"
      />
      <ProposalForm
        organizations={organizations}
        venues={venues}
      />
    </div>
  );
}
