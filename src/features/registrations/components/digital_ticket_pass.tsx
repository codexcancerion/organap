"use client";

import React from "react";
import { Button, Chip, Modal } from "@heroui/react";
import {
  Calendar,
  MapPin,
  CheckCircle2,
  QrCode,
  Download,
  Ticket,
} from "lucide-react";

import { generateQrSvg } from "@/utils/qr";

export type DigitalTicketPassProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  organizationName: string;
  venueName: string;
  startTime: string;
  endTime: string;
  studentName: string;
  schoolId: string;
  qrToken: string;
  status: "confirmed" | "attended";
};

export function DigitalTicketPass({
  isOpen,
  onOpenChange,
  eventTitle,
  organizationName,
  venueName,
  startTime,
  endTime: _endTime,
  studentName,
  schoolId,
  qrToken,
  status,
}: DigitalTicketPassProps) {
  const [svgContent, setSvgContent] = React.useState<string>("");

  React.useEffect(() => {
    if (qrToken) {
      generateQrSvg(qrToken).then(setSvgContent);
    }
  }, [qrToken]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Dialog className="border border-border/40 shadow-2xl bg-surface max-w-md p-0 overflow-hidden rounded-3xl">
        <Modal.Header className="bg-primary/10 border-b border-primary/20 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="text-primary size-5" />
            <Modal.Heading className="text-base font-bold text-foreground">
              Official Entry Pass
            </Modal.Heading>
          </div>
          <Chip
            className={status === "attended" ? "bg-accent/15 text-accent" : "bg-success/15 text-success"}
            size="sm"
            variant="soft"
          >
            <CheckCircle2 className="mr-1 inline" size={12} />
            {status === "attended" ? "Verified Attended" : "Valid Ticket"}
          </Chip>
        </Modal.Header>

        <Modal.Body className="p-6 flex flex-col items-center gap-5">
          {/* Event Summary */}
          <div className="text-center flex flex-col gap-1 w-full">
            <span className="text-xs font-semibold text-accent">{organizationName}</span>
            <h2 className="text-lg font-bold text-foreground leading-snug line-clamp-2">
              {eventTitle}
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs text-muted mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {venueName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(startTime).toLocaleDateString()}
              </span>
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
          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] text-muted uppercase tracking-wider font-semibold">
              Verification Passcode
            </span>
            <span className="font-mono text-sm tracking-widest font-bold px-3 py-1 rounded-xl bg-default/15 border border-border/30 text-foreground">
              {qrToken.slice(0, 4)}-{qrToken.slice(4, 8)}-{qrToken.slice(8, 12)}-{qrToken.slice(12, 16)}
            </span>
          </div>

          {/* Student Identity Card */}
          <div className="w-full p-3.5 rounded-2xl bg-default/10 border border-border/20 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-foreground">{studentName}</p>
              <p className="text-muted text-[11px]">ID: {schoolId}</p>
            </div>
            <span className="text-[10px] text-muted font-mono">Present at entrance</span>
          </div>
        </Modal.Body>

        <Modal.Footer className="p-4 border-t border-border/20 flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button size="sm" variant="secondary" onClick={handlePrint}>
            <Download size={14} />
            Print / Save
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
}
