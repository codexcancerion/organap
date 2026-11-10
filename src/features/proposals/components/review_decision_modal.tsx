"use client";

import React from "react";
import {
  Button,
  Modal,
  TextArea,
  toast,
} from "@heroui/react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  endorseProposal,
  approveProposal,
  returnProposal,
  rejectProposal,
} from "../services/review_services";

export type ReviewAction = "endorse" | "approve" | "return" | "reject";

export type ReviewDecisionModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
  proposalTitle: string;
  stage: "adviser" | "student_affairs";
  action: ReviewAction;
  hasConflict?: boolean;
};

export function ReviewDecisionModal({
  isOpen,
  onOpenChange,
  proposalId,
  proposalTitle,
  stage,
  action,
  hasConflict = false,
}: ReviewDecisionModalProps) {
  const router = useRouter();
  const [remarks, setRemarks] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  const isPositive = action === "endorse" || action === "approve";
  const isReturn = action === "return";
  const requiresRemarks = !isPositive;

  const actionTitle = action === "endorse"
    ? "Endorse Event Proposal"
    : action === "approve"
      ? "Approve Event Proposal"
      : action === "return"
        ? "Return Proposal for Revision"
        : "Reject Event Proposal";

  const handleConfirm = async () => {
    if (requiresRemarks && !remarks.trim()) {
      toast.danger("Remarks are required for this action.");

      return;
    }

    if (action === "approve" && hasConflict) {
      toast.danger("Cannot approve proposal due to a venue scheduling conflict.");

      return;
    }

    setIsPending(true);

    try {
      let result;

      if (action === "endorse") {
        result = await endorseProposal(proposalId, remarks);
      } else if (action === "approve") {
        result = await approveProposal(proposalId, remarks);
      } else if (action === "return") {
        result = await returnProposal(proposalId, remarks, stage);
      } else {
        result = await rejectProposal(proposalId, remarks, stage);
      }

      if (!result.success) {
        toast.danger(result.error?.message ?? "Operation failed");

        return;
      }

      if (action === "endorse") {
        toast.success("Proposal endorsed and routed to Student Affairs.");
      } else if (action === "approve") {
        toast.success("Proposal officially approved! Event is now scheduled.");
      } else if (action === "return") {
        toast.info("Proposal returned to organization officer for revisions.");
      } else {
        toast.danger("Proposal has been rejected.");
      }

      onOpenChange(false);
      setRemarks("");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";

      toast.danger(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Dialog className="border border-border/40 shadow-xl bg-surface max-w-lg">
        <Modal.Header className="flex items-center gap-2">
          {action === "endorse" && <CheckCircle2 className="text-warning size-5" />}
          {action === "approve" && <CheckCircle2 className="text-success size-5" />}
          {action === "return" && <RotateCcw className="text-warning size-5" />}
          {action === "reject" && <XCircle className="text-danger size-5" />}
          <Modal.Heading className="text-lg font-bold">
            {actionTitle}
          </Modal.Heading>
        </Modal.Header>

        <Modal.Body className="flex flex-col gap-3 py-2">
          <p className="text-xs text-muted">
            You are reviewing: <strong>{proposalTitle}</strong>
          </p>

          {isPositive ? (
            <p className="text-xs text-muted">
              {action === "endorse"
                ? "Endorsing this proposal indicates that you have vetted the event objectives and endorse its submission to Student Affairs for venue reservation and final approval."
                : "Approving this proposal will officially reserve the venue, publish the event to the campus directory, and open student registration."}
            </p>
          ) : (
            <p className="text-xs text-muted">
              {isReturn
                ? "Please specify the amendments, documentation, or schedule changes required before the organization may resubmit."
                : "Please state the institutional justification for rejecting this event proposal."}
            </p>
          )}

          <div className="flex flex-col gap-1.5 pt-2">
            <label className="text-xs font-semibold text-foreground">
              Official Review Remarks {requiresRemarks && <span className="text-danger">*</span>}
            </label>
            <TextArea
              aria-label="Official review remarks"
              className="w-full text-xs"
              placeholder={requiresRemarks ? "Enter required feedback or instructions..." : "Optional reviewer notes..."}
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </Modal.Body>

        <Modal.Footer className="flex items-center justify-end gap-2 pt-3 border-t border-border/20">
          <Button
            isDisabled={isPending}
            size="md"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            className={action === "reject" ? "bg-danger text-danger-foreground" : ""}
            isDisabled={isPending || (action === "approve" && hasConflict)}
            size="md"
            variant={action === "reject" ? "danger" : isPositive ? "primary" : "secondary"}
            onClick={handleConfirm}
          >
            {isPending ? "Processing..." : actionTitle}
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
}
