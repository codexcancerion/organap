"use client";

import React from "react";
import {
  Button,
  Modal,
  TextArea,
  toast,
} from "@heroui/react";
import { Ban } from "lucide-react";
import { useRouter } from "next/navigation";

import { cancelApprovedEvent } from "../services/event_services";

export type CancelEventModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
};

export function CancelEventModal({
  isOpen,
  onOpenChange,
  eventId,
  eventTitle,
}: CancelEventModalProps) {
  const router = useRouter();
  const [reason, setReason] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.danger("Please provide an official cancellation reason.");

      return;
    }

    setIsPending(true);
    try {
      const res = await cancelApprovedEvent(eventId, reason);

      if (!res.success) {
        toast.danger(res.error?.message ?? "Failed to cancel event");

        return;
      }

      toast.danger(`Event "${eventTitle}" cancelled. Venue reservation released and registrants notified.`);
      onOpenChange(false);
      setReason("");
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
          <Ban className="text-danger size-5" />
          <Modal.Heading className="text-lg font-bold text-danger">
            Cancel Approved Event
          </Modal.Heading>
        </Modal.Header>

        <Modal.Body className="flex flex-col gap-3 py-2">
          <p className="text-xs text-muted">
            You are cancelling: <strong>{eventTitle}</strong>
          </p>
          <p className="text-xs text-muted leading-relaxed">
            Cancelling an approved event will immediately halt new student registrations, close check-in access, release the reserved venue for other campus bookings, and send notification alerts to all registered students.
          </p>

          <div className="flex flex-col gap-1.5 pt-2">
            <label className="text-xs font-semibold text-foreground">
              Official Cancellation Reason <span className="text-danger">*</span>
            </label>
            <TextArea
              aria-label="Official cancellation reason"
              className="w-full text-xs"
              placeholder="State the institutional reason (e.g. inclement weather, administrative rescheduling, facilities maintenance)..."
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
            Go Back
          </Button>

          <Button
            className="bg-danger text-danger-foreground hover:bg-danger/90"
            isDisabled={isPending}
            size="md"
            variant="danger"
            onClick={handleCancel}
          >
            {isPending ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
}
