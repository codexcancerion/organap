"use client";

import React from "react";
import {
  Button,
  Modal,
  TextField,
  Input,
  toast,
} from "@heroui/react";
import { QrCode, Scan, CheckCircle2 } from "lucide-react";

import { recordCheckIn } from "../services/attendance_services";

export type QrScannerDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSuccess: (studentName: string) => void;
};

export function QrScannerDialog({
  isOpen,
  onOpenChange,
  eventId,
  onSuccess,
}: QrScannerDialogProps) {
  const [tokenInput, setTokenInput] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  const handleScanSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!tokenInput.trim()) {
      toast.danger("Please scan or enter a pass token or Student ID.");

      return;
    }

    setIsPending(true);
    try {
      const res = await recordCheckIn(eventId, tokenInput, "qr_scanner");

      if (!res.success) {
        toast.danger(res.error?.message ?? "Check-in failed");

        return;
      }

      toast.success(`Check-In Verified: ${res.data.studentName} (${res.data.schoolId}) 🎉`);
      onSuccess(res.data.studentName);
      setTokenInput("");
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";

      toast.danger(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Dialog className="border border-border/40 shadow-2xl bg-surface max-w-md">
        <Modal.Header className="flex items-center gap-2">
          <Scan className="text-primary size-5" />
          <Modal.Heading className="text-base font-bold text-foreground">
            Digital QR Ticket Scanner
          </Modal.Heading>
        </Modal.Header>

        <Modal.Body className="flex flex-col items-center gap-4 py-2">
          {/* Simulated Scanner Viewport */}
          <div className="w-full h-48 rounded-2xl bg-black/90 border border-border/40 relative flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-4 border-2 border-dashed border-primary/60 rounded-xl pointer-events-none animate-pulse" />
            <QrCode className="text-white/40 size-20" />
            <span className="text-[11px] text-white/70 mt-2 font-mono">
              Align attendee QR code inside frame
            </span>
          </div>

          {/* Quick Input Bar */}
          <form className="w-full flex flex-col gap-2" onSubmit={handleScanSubmit}>
            <label className="text-xs font-semibold text-foreground">
              Passcode or Student School ID
            </label>
            <TextField
              aria-label="Passcode or Student ID"
              value={tokenInput}
              onChange={(val) => setTokenInput(val)}
            >
              <Input
                autoFocus
                placeholder="Scan QR or paste 16-hex token / 2026-XXXX…"
              />
            </TextField>
          </form>
        </Modal.Body>

        <Modal.Footer className="flex items-center justify-between border-t border-border/20 pt-3">
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            isDisabled={isPending}
            size="sm"
            variant="primary"
            onClick={() => handleScanSubmit()}
          >
            <CheckCircle2 size={14} />
            {isPending ? "Verifying..." : "Verify Pass"}
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
}
