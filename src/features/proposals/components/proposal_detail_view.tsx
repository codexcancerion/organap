"use client";

import type { ProposalDetail } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Button,
  Card,
  toast,
} from "@heroui/react";
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit2,
  Send,
  CheckCircle2,
  RotateCcw,
  XCircle,
  FileText,
  ArrowLeft,
  Ban,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page_header";

import { submitProposal } from "../services/proposal_services";

import { ProposalStatusChip } from "./proposal_status_chip";
import { ProposalTimeline } from "./proposal_timeline";
import { VenueConflictAlert } from "./venue_conflict_alert";
import { ReviewDecisionModal, type ReviewAction } from "./review_decision_modal";

export type ProposalDetailViewProps = {
  proposal: ProposalDetail;
  currentUserId: string;
  isSuperuser: boolean;
  isStaff: boolean;
  canEndorse: boolean;
  canApprove: boolean;
  isAuthorOrOfficer: boolean;
  hasConflict?: boolean;
};

export function ProposalDetailView({
  proposal,
  currentUserId: _currentUserId,
  isSuperuser,
  isStaff,
  canEndorse,
  canApprove,
  isAuthorOrOfficer,
  hasConflict = false,
}: ProposalDetailViewProps) {
  const router = useRouter();
  const [modalAction, setModalAction] = React.useState<ReviewAction | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const canEdit =
    (proposal.status === "draft" ||
      proposal.status === "returned_by_adviser" ||
      proposal.status === "returned_by_student_affairs") &&
    (isAuthorOrOfficer || isSuperuser);

  const canSubmitDraft = proposal.status === "draft" && (isAuthorOrOfficer || isSuperuser);

  const isPendingAdviser = proposal.status === "pending_adviser" && (canEndorse || isSuperuser);
  const isPendingSA = proposal.status === "pending_student_affairs" && (canApprove || isStaff || isSuperuser);

  const handleSubmitDraft = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitProposal(proposal.id);

      if (!res.success) {
        toast.danger(res.error?.message ?? "Submission failed");

        return;
      }

      toast.success("Proposal submitted for faculty adviser review.");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";

      toast.danger(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <NextLink
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors w-fit"
        href="/proposals"
      >
        <ArrowLeft size={14} />
        Back to Event Proposals
      </NextLink>

      {/* Standard Cardless Page Header */}
      <PageHeader
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <NextLink href={`/proposals/${proposal.id}/edit`}>
                <Button size="md" variant="secondary">
                  <Edit2 size={16} />
                  Edit Proposal
                </Button>
              </NextLink>
            )}

            {canSubmitDraft && (
              <Button
                isDisabled={isSubmitting}
                size="md"
                variant="primary"
                onClick={handleSubmitDraft}
              >
                <Send size={16} />
                {isSubmitting ? "Submitting..." : "Submit to Adviser"}
              </Button>
            )}

            {isPendingAdviser && (
              <>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => setModalAction("return")}
                >
                  <RotateCcw size={16} />
                  Return
                </Button>
                <Button
                  className="bg-danger text-danger-foreground hover:bg-danger/90"
                  size="md"
                  variant="danger"
                  onClick={() => setModalAction("reject")}
                >
                  <XCircle size={16} />
                  Reject
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => setModalAction("endorse")}
                >
                  <CheckCircle2 size={16} />
                  Endorse Proposal
                </Button>
              </>
            )}

            {isPendingSA && (
              <>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => setModalAction("return")}
                >
                  <RotateCcw size={16} />
                  Return
                </Button>
                <Button
                  className="bg-danger text-danger-foreground hover:bg-danger/90"
                  size="md"
                  variant="danger"
                  onClick={() => setModalAction("reject")}
                >
                  <XCircle size={16} />
                  Reject
                </Button>
                <Button
                  isDisabled={hasConflict}
                  size="md"
                  variant="primary"
                  onClick={() => setModalAction("approve")}
                >
                  <CheckCircle2 size={16} />
                  Approve Event
                </Button>
              </>
            )}
          </div>
        }
        badge={<ProposalStatusChip status={proposal.status} />}
        description={`Submitted by ${proposal.creatorName ?? "Officer"} on ${new Date(proposal.createdAt).toLocaleDateString()}`}
        title={proposal.title}
      />

      {/* Venue Conflict Warning Banner if Pending SA */}
      {proposal.status === "pending_student_affairs" && (
        <VenueConflictAlert hasConflict={hasConflict} venueName={proposal.venueName} />
      )}

      {/* Cancellation Banner */}
      {proposal.status === "cancelled" && (
        <Card className="border border-danger/30 bg-danger/10 p-5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-danger font-semibold text-sm">
            <Ban size={16} />
            <span>This event was cancelled by Student Affairs</span>
          </div>
          <p className="text-xs text-foreground/90">
            <strong>Reason:</strong> {proposal.cancellationReason ?? "No detailed reason specified."}
          </p>
        </Card>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Event Purpose & Activities */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border border-border/30 bg-surface p-6 gap-4">
            <div className="flex items-center gap-2 border-b border-border/20 pb-3">
              <FileText className="text-primary size-5" />
              <h2 className="text-base font-bold text-foreground">Event Purpose & Justification</h2>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {proposal.purpose}
            </p>
          </Card>

          <Card className="border border-border/30 bg-surface p-6 gap-4">
            <div className="flex items-center gap-2 border-b border-border/20 pb-3">
              <Calendar className="text-primary size-5" />
              <h2 className="text-base font-bold text-foreground">Program & Activities Sequence</h2>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {proposal.activitiesDesc}
            </p>
          </Card>

          {/* Timeline Audit History (FR-09) */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="text-accent" size={16} />
              <span>Review & Endorsement Timeline</span>
            </h3>
            <ProposalTimeline reviews={proposal.reviews} />
          </div>
        </div>

        {/* Right Column: Event Specifications & Metadata */}
        <div className="flex flex-col gap-5">
          <Card className="border border-border/30 bg-surface p-5 gap-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
              Event Specifications
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-start gap-3">
                <Building2 className="text-primary size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{proposal.organizationName}</p>
                  <p className="text-muted text-[11px]">{proposal.organizationAcronym} · Host Organization</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="text-primary size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{proposal.venueName}</p>
                  <p className="text-muted text-[11px]">Max Venue Capacity: {proposal.venueCapacity}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="text-primary size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{proposal.capacity} Participants</p>
                  <p className="text-muted text-[11px]">Target Quota</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-primary size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    {new Date(proposal.startTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-muted text-[11px]">
                    {new Date(proposal.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(proposal.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="text-warning size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    {new Date(proposal.registrationDeadline).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-muted text-[11px]">Registration Deadline</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Review Decision Modal */}
      {modalAction && (
        <ReviewDecisionModal
          action={modalAction}
          hasConflict={hasConflict}
          isOpen={!!modalAction}
          proposalId={proposal.id}
          proposalTitle={proposal.title}
          stage={isPendingAdviser ? "adviser" : "student_affairs"}
          onOpenChange={(open) => !open && setModalAction(null)}
        />
      )}
    </div>
  );
}
