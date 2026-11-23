"use client";

import React from "react";
import { Alert, Button, Chip, Modal, Separator, toast } from "@heroui/react";
import {
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  MapPin,
  QrCode,
  Ticket,
} from "lucide-react";

import { generateQrSvg } from "@/utils/qr";

export type DigitalTicketPassProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  eventStatus?: string;
  organizationName: string;
  venueName: string;
  startTime: string;
  endTime: string;
  studentName: string;
  schoolId: string;
  qrToken: string;
  status: "confirmed" | "attended";
  checkInAt?: string | null;
  checkInMethod?: "manual" | "qr_scanner" | null;
};

function formatPasscode(token: string): string {
  const head = token.slice(0, 16).toUpperCase();
  const groups = head.match(/.{1,4}/g);

  return groups ? groups.join("-") : head;
}

export function DigitalTicketPass({
  isOpen,
  onOpenChange,
  eventTitle,
  eventStatus = "approved",
  organizationName,
  venueName,
  startTime,
  endTime,
  studentName,
  schoolId,
  qrToken,
  status,
  checkInAt,
  checkInMethod,
}: DigitalTicketPassProps) {
  const [qrState, setQrState] = React.useState<{ token: string; svg: string } | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    if (!qrToken) {
      return () => {
        active = false;
      };
    }

    generateQrSvg(qrToken).then((svg) => {
      if (active) {
        setQrState({ token: qrToken, svg });
      }
    });

    return () => {
      active = false;
    };
  }, [qrToken]);

  const svgContent = qrToken && qrState?.token === qrToken ? qrState.svg : "";

  const isCancelled = eventStatus === "cancelled";
  const formattedPasscode = formatPasscode(qrToken);

  const handleCopyToken = async () => {
    if (!qrToken) return;

    try {
      await navigator.clipboard.writeText(qrToken);
      setCopied(true);
      toast.success("Pass token copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.danger("Unable to copy pass token to clipboard.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const startDate = startTime ? new Date(startTime) : null;
  const endDate = endTime ? new Date(endTime) : null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="md">
          <Modal.Dialog className="border border-border/40 shadow-2xl bg-surface p-0 overflow-hidden rounded-3xl">
            <Modal.CloseTrigger />
            <Modal.Header className="bg-accent/10 border-b border-border/30 p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Modal.Icon className="bg-accent/15 text-accent">
                  <Ticket className="size-5" />
                </Modal.Icon>
                <Modal.Heading className="text-base font-bold text-foreground">
                  Official Entry Pass
                </Modal.Heading>
              </div>
              <Chip
                color={
                  isCancelled
                    ? "danger"
                    : status === "attended"
                      ? "accent"
                      : "success"
                }
                size="sm"
                variant="soft"
              >
                {isCancelled ? (
                  <Ban className="mr-1 inline" size={12} />
                ) : (
                  <CheckCircle2 className="mr-1 inline" size={12} />
                )}
                {isCancelled
                  ? "Event Cancelled"
                  : status === "attended"
                    ? "Verified Attended"
                    : "Valid Ticket"}
              </Chip>
            </Modal.Header>

            <Modal.Body className="p-6 flex flex-col items-center gap-4">
              {isCancelled ? (
                <Alert className="w-full" status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Event Cancelled</Alert.Title>
                    <Alert.Description>
                      This event was cancelled by Student Affairs. Entry check-in is closed.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}

              {/* Event Summary */}
              <div className="text-center flex flex-col gap-1 w-full">
                <span className="text-xs font-semibold text-accent">
                  {organizationName}
                </span>
                <h2 className="text-lg font-bold text-foreground leading-snug line-clamp-2">
                  {eventTitle}
                </h2>
                <div className="flex items-center justify-center gap-x-3 gap-y-1 text-xs text-muted mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {venueName}
                  </span>
                  {startDate ? (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {startDate.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  ) : null}
                  {startDate && endDate ? (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {startDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {endDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-4 rounded-2xl bg-white border border-border/30 shadow-xs flex flex-col items-center gap-2 w-52 h-52 justify-center">
                {svgContent ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                    className="w-44 h-44 flex items-center justify-center"
                  />
                ) : (
                  <QrCode className="text-muted size-32 animate-pulse" />
                )}
              </div>

              {/* Verification Token */}
              <div className="flex flex-col items-center gap-1.5 w-full">
                <span className="text-[11px] text-muted uppercase tracking-wider font-semibold">
                  Verification Passcode
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm tracking-widest font-bold px-3 py-1 rounded-xl bg-default/15 border border-border/30 text-foreground">
                    {formattedPasscode || "PENDING"}
                  </span>
                  {qrToken ? (
                    <Button
                      isIconOnly
                      aria-label="Copy verification pass token"
                      size="sm"
                      variant="tertiary"
                      onPress={handleCopyToken}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  ) : null}
                </div>
              </div>

              <Separator className="w-full" />

              {/* Student Identity Card */}
              <div className="w-full p-3.5 rounded-2xl bg-default/10 border border-border/20 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{studentName}</p>
                  <p className="text-muted text-[11px]">ID: {schoolId}</p>
                </div>
                {status === "attended" && checkInAt ? (
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-accent text-[11px]">
                      Checked In {new Date(checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-[10px] text-muted uppercase">
                      {checkInMethod === "qr_scanner" ? "QR Scan" : "Manual Desk"}
                    </p>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted font-mono shrink-0">
                    Present at entrance
                  </span>
                )}
              </div>
            </Modal.Body>

            <Modal.Footer className="p-4 border-t border-border/20 flex items-center justify-between">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button size="sm" variant="secondary" onPress={handlePrint}>
                <Download size={14} />
                Print / Save
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
