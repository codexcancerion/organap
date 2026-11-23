"use client";

import type { ActivityType, ProposalDetail } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Button,
  Card,
  toast,
} from "@heroui/react";
import {
  AlertTriangle,
  Ban,
  Building2,
  Calendar,
  CalendarRange,
  CheckCircle2,
  Clock,
  Edit2,
  FileText,
  MapPin,
  RotateCcw,
  Send,
  Tag,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page_header";
import { Section } from "@/components/layout/section";
import { ConfirmDeleteModal } from "@/components/ui/confirm_delete_modal";
import { EventAttachmentsCard } from "@/components/ui/event_attachments_card";
import { ProposalStatusChip } from "@/components/ui/proposal_status_chip";
import { mergeEventRationale } from "@/utils/formatters";

import { ACTIVITY_TYPE_LABELS } from "../types";
import { deleteDraft, submitProposal } from "../services/proposal_services";

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const isReturned =
    proposal.status === "returned_by_adviser" ||
    proposal.status === "returned_by_student_affairs";
  const isRejected =
    proposal.status === "rejected_by_adviser" ||
    proposal.status === "rejected_by_student_affairs";

  const canEdit =
    (proposal.status === "draft" || isReturned) &&
    (isAuthorOrOfficer || isSuperuser);

  const canSubmitOrResubmit = canEdit;
  const canDeleteDraft =
    proposal.status === "draft" && (isAuthorOrOfficer || isSuperuser);

  const isPendingAdviser = proposal.status === "pending_adviser" && (canEndorse || isSuperuser);
  const isPendingSA = proposal.status === "pending_student_affairs" && (canApprove || isStaff || isSuperuser);

  const latestFeedbackReview = React.useMemo(() => {
    if (!isReturned && !isRejected) return null;

    const targetDecision = isReturned ? "returned_for_revision" : "rejected";
    const matching = proposal.reviews.filter((r) => r.decision === targetDecision);

    return matching[matching.length - 1] ?? proposal.reviews[proposal.reviews.length - 1] ?? null;
  }, [isReturned, isRejected, proposal.reviews]);

  const contributors = React.useMemo(() => {
    const names = new Set<string>();

    if (proposal.creatorName) {
      names.add(proposal.creatorName);
    }

    for (const att of proposal.attachments) {
      if (att.uploadedByName) {
        names.add(att.uploadedByName);
      }
    }

    return Array.from(names);
  }, [proposal.creatorName, proposal.attachments]);

  const handleSubmitDraft = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitProposal(proposal.id);

      if (!res.success) {
        toast.danger(res.error?.message ?? "Submission failed");

        return;
      }

      toast.success(
        isReturned
          ? "Revised proposal resubmitted for faculty adviser review."
          : "Proposal submitted for faculty adviser review.",
      );
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";

      toast.danger(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDraft = async () => {
    const res = await deleteDraft(proposal.id);

    if (!res.success) {
      toast.danger(res.error?.message ?? "Failed to delete draft");

      return;
    }

    toast.success("Proposal draft deleted.");
    setIsDeleteModalOpen(false);
    router.push("/events");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Standard Cardless Page Header */}
      <PageHeader
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {proposal.status === "approved" ? (
              <NextLink href={`/events/${proposal.id}`}>
                <Button size="md" variant="secondary">
                  Back to Public Event View
                </Button>
              </NextLink>
            ) : null}

            {canEdit && (
              <NextLink href={`/events/${proposal.id}/edit`}>
                <Button size="md" variant="secondary">
                  <Edit2 size={16} />
                  Edit &amp; Upload Attachments
                </Button>
              </NextLink>
            )}

            {canSubmitOrResubmit && (
              <Button
                isDisabled={isSubmitting}
                size="md"
                variant="primary"
                onPress={handleSubmitDraft}
              >
                <Send size={16} />
                {isSubmitting
                  ? "Submitting..."
                  : isReturned
                    ? "Resubmit to Adviser"
                    : "Submit to Adviser"}
              </Button>
            )}

            {canDeleteDraft && (
              <Button
                className="text-danger hover:bg-danger/10"
                isDisabled={isSubmitting}
                size="md"
                variant="ghost"
                onPress={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 size={16} />
                Delete Draft
              </Button>
            )}

            {isPendingAdviser && (
              <>
                <Button
                  size="md"
                  variant="secondary"
                  onPress={() => setModalAction("return")}
                >
                  <RotateCcw size={16} />
                  Return
                </Button>
                <Button
                  className="bg-danger text-danger-foreground hover:bg-danger/90"
                  size="md"
                  variant="danger"
                  onPress={() => setModalAction("reject")}
                >
                  <XCircle size={16} />
                  Reject
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  onPress={() => setModalAction("endorse")}
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
                  onPress={() => setModalAction("return")}
                >
                  <RotateCcw size={16} />
                  Return
                </Button>
                <Button
                  className="bg-danger text-danger-foreground hover:bg-danger/90"
                  size="md"
                  variant="danger"
                  onPress={() => setModalAction("reject")}
                >
                  <XCircle size={16} />
                  Reject
                </Button>
                <Button
                  isDisabled={hasConflict}
                  size="md"
                  variant="primary"
                  onPress={() => setModalAction("approve")}
                >
                  <CheckCircle2 size={16} />
                  Approve Event
                </Button>
              </>
            )}
          </div>
        }
        badge={<ProposalStatusChip status={proposal.status} />}
        breadcrumbs={[
          { label: "Back to Events & Proposals", href: "/events" },
          { label: proposal.title },
        ]}
        description={`Submitted by ${proposal.creatorName ?? "Officer"} on ${new Date(proposal.createdAt).toLocaleDateString()}`}
        title={proposal.title}
      />

      {/* Revision Requested or Rejection Feedback Banner */}
      {(isReturned || isRejected) && (
        <Card
          className={`p-5 flex flex-col gap-2.5 border ${
            isReturned
              ? "border-warning/40 bg-warning/10"
              : "border-danger/30 bg-danger/10"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div
              className={`flex items-center gap-2 font-semibold text-sm ${
                isReturned ? "text-warning" : "text-danger"
              }`}
            >
              {isReturned ? <AlertTriangle size={16} /> : <XCircle size={16} />}
              <span>
                {isReturned
                  ? proposal.status === "returned_by_adviser"
                    ? "Revision Requested by Faculty Adviser"
                    : "Revision Requested by Student Affairs"
                  : proposal.status === "rejected_by_adviser"
                    ? "Proposal Rejected by Faculty Adviser"
                    : "Proposal Rejected by Student Affairs"}
              </span>
            </div>

            {isReturned && canEdit ? (
              <NextLink href={`/events/${proposal.id}/edit`}>
                <Button size="sm" variant="secondary">
                  <Edit2 size={14} />
                  Revise &amp; Upload Attachments
                </Button>
              </NextLink>
            ) : null}
          </div>

          {latestFeedbackReview ? (
            <div className="flex flex-col gap-1 text-xs text-foreground/90">
              <p className="text-[11px] text-muted">
                Reviewed by <strong>{latestFeedbackReview.reviewerName}</strong> on{" "}
                {new Date(latestFeedbackReview.createdAt).toLocaleString()}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">
                {latestFeedbackReview.remarks || "No specific remarks recorded."}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted">
              Check the review timeline below for reviewer details.
            </p>
          )}
        </Card>
      )}

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
        {/* Left Column: Event Rationale, Attachments & Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border border-border/30 bg-surface p-6 gap-4">
            <div className="flex items-center gap-2 border-b border-border/20 pb-3">
              <FileText className="text-primary size-5" />
              <h2 className="text-base font-bold text-foreground">Event Rationale &amp; Description</h2>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {mergeEventRationale(proposal.purpose, proposal.activitiesDesc)}
            </p>
          </Card>

          <EventAttachmentsCard
            attachments={proposal.attachments}
            emptyMessage="No attachments uploaded for this proposal."
          />

          {/* Timeline Audit History (FR-09) */}
          <Section
            as="h3"
            icon={<Clock className="text-accent" size={16} />}
            title="Review & Endorsement Timeline"
          >
            <ProposalTimeline reviews={proposal.reviews} />
          </Section>
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

              {contributors.length > 0 ? (
                <div className="flex items-start gap-3">
                  <Users className="text-primary size-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {contributors.join(", ")}
                    </p>
                    <p className="text-muted text-[11px]">
                      Contributors ({contributors.length})
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="flex items-start gap-3">
                <Tag className="text-primary size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    {ACTIVITY_TYPE_LABELS[proposal.activityType as ActivityType] ?? proposal.activityType ?? "Seminar / Conference"}
                  </p>
                  <p className="text-muted text-[11px]">Activity Type</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarRange className="text-primary size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    {proposal.semesterName ?? "Not assigned"}
                  </p>
                  <p className="text-muted text-[11px]">Academic Semester</p>
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

      {/* Draft Deletion Confirmation */}
      {canDeleteDraft && (
        <ConfirmDeleteModal
          confirmLabel="Delete Draft"
          description={
            <>
              Are you sure you want to permanently delete the draft{" "}
              <strong>{proposal.title}</strong> and its uploaded attachments?
            </>
          }
          isOpen={isDeleteModalOpen}
          title="Delete Event Draft"
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteDraft}
        />
      )}
    </div>
  );
}
