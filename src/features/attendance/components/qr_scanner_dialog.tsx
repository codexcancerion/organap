"use client";

import React from "react";
import {
  Alert,
  Button,
  Description,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { CheckCircle2, QrCode, Scan } from "lucide-react";

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
  const [lastVerified, setLastVerified] = React.useState<{
    studentName: string;
    schoolId: string;
    checkInAt: string;
  } | null>(null);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleScanSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = tokenInput.trim();

    if (!trimmed) {
      setScanError("Please scan or enter a pass token or Student School ID.");
      toast.danger("Please scan or enter a pass token or Student School ID.");

      return;
    }

    setIsPending(true);
    setScanError(null);
    try {
      const res = await recordCheckIn(eventId, trimmed, "qr_scanner");

      if (!res.success) {
        const msg = res.error?.message ?? "Check-in failed";

        setScanError(msg);
        toast.danger(msg);

        return;
      }

      // UI/UX FLOW: Keep the scanner dialog open and refocus the input after each verified pass
      // so entrance officers can verify back-to-back student queues without reopening the modal.
      setLastVerified(res.data);
      toast.success(
        `Check-In Verified: ${res.data.studentName} (${res.data.schoolId})`
      );
      onSuccess(res.data.studentName);
      setTokenInput("");
      inputRef.current?.focus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";

      setScanError(msg);
      toast.danger(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !isPending && onOpenChange(open)}
    >
      <Modal.Backdrop variant="blur">
        <Modal.Container size="md">
          <Modal.Dialog className="border border-border/40 shadow-2xl bg-surface">
            <Modal.CloseTrigger />
            <Modal.Header className="flex items-center gap-2.5">
              <Modal.Icon className="bg-accent/15 text-accent">
                <Scan className="size-5" />
              </Modal.Icon>
              <Modal.Heading className="text-base font-bold text-foreground">
                Digital QR Ticket Scanner
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="flex flex-col items-center gap-4 py-2">
              {/* Simulated Scanner Viewport */}
              <div className="w-full h-44 rounded-2xl bg-black/90 border border-border/40 relative flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-4 border-2 border-dashed border-accent/60 rounded-xl pointer-events-none animate-pulse" />
                <QrCode className="text-white/40 size-16" />
                <span className="text-[11px] text-white/70 mt-2 font-mono">
                  Align attendee QR code or paste token below
                </span>
              </div>

              {lastVerified ? (
                <Alert className="w-full" status="success">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>
                      Verified: {lastVerified.studentName} ({lastVerified.schoolId})
                    </Alert.Title>
                    <Alert.Description>
                      Checked in at{" "}
                      {new Date(lastVerified.checkInAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      . Ready for next attendee pass.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}

              {scanError ? (
                <Alert className="w-full" status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Verification Rejected</Alert.Title>
                    <Alert.Description>{scanError}</Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}

              {/* Quick Input Bar */}
              <form className="w-full flex flex-col gap-2" onSubmit={handleScanSubmit}>
                <TextField
                  isDisabled={isPending}
                  name="qr-token-input"
                  value={tokenInput}
                  onChange={(val) => {
                    setTokenInput(val);
                    if (scanError) setScanError(null);
                  }}
                >
                  <Label>Passcode or Student School ID</Label>
                  <Input
                    ref={inputRef}
                    autoFocus
                    placeholder="Paste pass token, XXXX-XXXX-XXXX-XXXX, or 2026-XXXX…"
                  />
                  <Description>
                    Accepts the full QR token, 16-character pass code, or student School ID.
                  </Description>
                </TextField>
              </form>
            </Modal.Body>

            <Modal.Footer className="flex items-center justify-between border-t border-border/20 pt-3">
              <Button
                isDisabled={isPending}
                size="sm"
                variant="ghost"
                onPress={() => onOpenChange(false)}
              >
                Done
              </Button>
              <Button
                isDisabled={isPending}
                isPending={isPending}
                size="sm"
                variant="primary"
                onPress={() => handleScanSubmit()}
              >
                {isPending ? (
                  <Spinner color="current" size="sm" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {isPending ? "Verifying..." : "Verify Pass"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
