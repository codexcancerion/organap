"use client";

import type { AttendanceEventItem, AttendanceRosterItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Button,
  Card,
  Chip,
} from "@heroui/react";
import {
  ArrowLeft,
  Clock,
  Scan,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page_header";

import { QrScannerDialog } from "./qr_scanner_dialog";
import { ManualCheckinTable } from "./manual_checkin_table";

export type AttendanceConsoleProps = {
  event: AttendanceEventItem;
  roster: AttendanceRosterItem[];
};

export function AttendanceConsole({ event, roster }: AttendanceConsoleProps) {
  const router = useRouter();
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);

  const attendedCount = roster.filter((r) => r.status === "attended").length;
  const totalRegistered = roster.length;
  const attendanceRate = totalRegistered > 0 ? Math.round((attendedCount / totalRegistered) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <NextLink
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors w-fit"
        href="/attendance"
      >
        <ArrowLeft size={14} />
        Back to Attendance Desk
      </NextLink>

      {/* Standard Cardless Page Header */}
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Button
              isDisabled={!event.isWindowOpen}
              size="md"
              variant="primary"
              onClick={() => setIsScannerOpen(true)}
            >
              <Scan size={16} />
              Open QR Scanner
            </Button>
          </div>
        }
        badge={
          event.isWindowOpen ? (
            <Chip color="success" size="sm" variant="soft">
              <span className="size-2 rounded-full bg-success animate-ping mr-1.5 inline-block" />
              Check-In Window Active
            </Chip>
          ) : event.isWindowClosed ? (
            <Chip color="default" size="sm" variant="soft">
              Check-In Closed (Event Ended)
            </Chip>
          ) : (
            <Chip color="warning" size="sm" variant="soft">
              Opens 30m Before Start
            </Chip>
          )
        }
        description={`${event.organizationName} · ${event.venueName} · ${new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(event.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        title={`Check-In Console: ${event.title}`}
      />

      {/* Window Alert if Not Active */}
      {!event.isWindowOpen && !event.isWindowClosed && (
        <Card className="border border-warning/30 bg-warning/10 p-4 flex flex-row items-center gap-3">
          <Clock className="text-warning size-5 shrink-0" />
          <p className="text-xs text-foreground/90 leading-relaxed">
            Per institutional rules (FR-13), attendance verification opens <strong>30 minutes prior to event start</strong> ({new Date(new Date(event.startTime).getTime() - 30 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}). You may review registered attendees below.
          </p>
        </Card>
      )}

      {/* 3 Real-time Attendance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/30 bg-surface p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted">Confirmed Registrations</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-foreground">{totalRegistered}</span>
            <span className="text-xs text-muted">of {event.capacity} cap</span>
          </div>
        </Card>

        <Card className="border border-border/30 bg-surface p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted">Attendees Checked In</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-success">{attendedCount}</span>
            <span className="text-xs text-success font-semibold">Verified</span>
          </div>
        </Card>

        <Card className="border border-border/30 bg-surface p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted">Participation Turnout Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-primary">{attendanceRate}%</span>
            <span className="text-xs text-muted">Turnout</span>
          </div>
        </Card>
      </div>

      {/* Attendee Roster Table */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-foreground">Attendee Roster & Verification</h3>
        <ManualCheckinTable
          eventId={event.id}
          isWindowOpen={event.isWindowOpen}
          roster={roster}
          onRefresh={() => router.refresh()}
        />
      </div>

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <QrScannerDialog
          eventId={event.id}
          isOpen={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
