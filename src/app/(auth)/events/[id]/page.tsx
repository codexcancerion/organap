import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getEventById } from "@/features/events/services/event_queries";
import { getProposalById, getProposalCollaborationAccess } from "@/features/proposals/services/proposal_queries";
import { EventDetailCard } from "@/features/events/components/event_detail_card";
import { ProposalDetailView } from "@/features/proposals/components/proposal_detail_view";
import { checkVenueConflict } from "@/features/proposals/services/review_services";
import { getEventRegistrationStatus } from "@/features/registrations/services/registration_queries";
import { RegistrationActionButton } from "@/features/registrations/components/registration_action_button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [event, proposal] = await Promise.all([
    getEventById(id),
    getProposalById(id),
  ]);

  const title = event?.title || proposal?.title || "Campus Event";

  return {
    title: `${title} | Campus Events`,
  };
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ view?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewMode = resolvedSearchParams?.view;

  const [event, proposal] = await Promise.all([
    getEventById(id, user.id),
    getProposalById(id),
  ]);

  if (!event && !proposal) {
    notFound();
  }

  const access = proposal
    ? await getProposalCollaborationAccess(proposal.organizationId, user.id)
    : { isOrgMember: false, isOrgOfficerOrGovernor: false, isOrgAdviser: false };

  const isAuthorOrOfficer = proposal
    ? proposal.createdById === user.id ||
      access.isOrgMember ||
      access.isOrgOfficerOrGovernor ||
      user.permissions.includes("proposals.create")
    : false;
  const canEndorse =
    user.isSuperuser ||
    access.isOrgAdviser ||
    proposal?.organizationAdviserId === user.id ||
    user.permissions.includes("proposals.endorse");
  const canApprove =
    user.isSuperuser || user.isStaff || user.permissions.includes("proposals.approve");
  const canViewReviewRecord = isAuthorOrOfficer || canEndorse || canApprove;

  // If the item is in review workflow (pending, draft, returned, rejected) OR viewer explicitly requested proposal review view
  if ((proposal && proposal.status !== "approved") || (viewMode === "review" && proposal)) {
    let hasConflict = false;

    if (proposal && proposal.status === "pending_student_affairs") {
      hasConflict = await checkVenueConflict(
        proposal.venueId,
        proposal.startTime,
        proposal.endTime,
        proposal.id
      );
    }

    if (proposal) {
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
  }

  // Published Approved Event Attendee & Registration View
  if (event) {
    const regStatus = await getEventRegistrationStatus(event.id, user.id);
    const isStaffOrSA = user.isSuperuser || user.isStaff;
    const canManageAttendance =
      isStaffOrSA || access.isOrgOfficerOrGovernor;

    return (
      <EventDetailCard
        actionSlot={
          <RegistrationActionButton
            capacity={event.capacity}
            checkInAt={regStatus.checkInAt}
            endTime={event.endTime}
            eventId={event.id}
            eventTitle={event.title}
            isRegistered={regStatus.isRegistered}
            organizationName={event.organizationName}
            qrToken={regStatus.qrToken}
            registeredCount={event.registeredCount}
            registrationDeadline={event.registrationDeadline}
            registrationId={regStatus.registrationId}
            registrationStatus={regStatus.status}
            schoolId={user.schoolId ?? "N/A"}
            startTime={event.startTime}
            studentName={user.displayName ?? user.email}
            venueName={event.venueName}
          />
        }
        canManageAttendance={canManageAttendance}
        canViewReviewRecord={canViewReviewRecord}
        event={event}
        isStaffOrSA={isStaffOrSA}
      />
    );
  }

  notFound();
}
