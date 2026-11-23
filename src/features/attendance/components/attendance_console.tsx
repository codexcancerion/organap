"use client";

import type { AttendanceEventItem, AttendanceRosterItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Alert,
  Button,
  Card,
  Chip,
  ProgressBar,
  toast,
} from "@heroui/react";
import {
  Download,
  FileText,
  Scan,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page_header";
import { Section } from "@/components/layout/section";
import {
  downloadCsvFile,
  generateAttendanceReportCsv,
} from "@/utils/attendance_csv";

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
  const attendanceRate =
    totalRegistered > 0 ? Math.round((attendedCount / totalRegistered) * 100) : 0;
  const capacityUtilization =
    event.capacity > 0
      ? Math.min(100, Math.round((totalRegistered / event.capacity) * 100))
      : 0;
  const isCancelled = event.status === "cancelled";

  const handleExportCsv = () => {
    try {
      const csv = generateAttendanceReportCsv(
        {
          eventTitle: event.title,
          organizationName: event.organizationName,
          organizationAcronym: event.organizationAcronym,
          venueName: event.venueName,
          startTime: event.startTime,
          endTime: event.endTime,
          capacity: event.capacity,
          totalRegistered,
          totalAttended: attendedCount,
          attendanceRate,
        },
        roster.map((r) => ({
          fullName: r.fullName,
          schoolId: r.schoolId,
          email: r.email ?? "",
          registeredAt: r.registeredAt ?? "",
          attended: r.status === "attended",
          attendedAt: r.checkInAt,
          checkInMethod: r.checkInMethod,
        }))
      );

      const safeSlug = event.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      const dateStr = new Date().toISOString().slice(0, 10);

      downloadCsvFile(`organap_attendance_${safeSlug}_${dateStr}.csv`, csv);
      toast.success(`Exported CSV report for "${event.title}".`);
    } catch {
      toast.danger("Failed to generate CSV report.");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Standard Cardless Page Header */}
      <PageHeader
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <NextLink href={`/events/${event.id}`}>
              <Button size="md" variant="secondary">
                <FileText size={16} />
                Event Details
              </Button>
            </NextLink>
            <Button
              size="md"
              variant="secondary"
              onPress={handleExportCsv}
            >
              <Download size={16} />
              Export CSV Report
            </Button>
            <Button
              isDisabled={!event.isWindowOpen || isCancelled}
              size="md"
              variant="primary"
              onPress={() => setIsScannerOpen(true)}
            >
              <Scan size={16} />
              Open QR Scanner
            </Button>
          </div>
        }
        badge={
          isCancelled ? (
            <Chip color="danger" size="sm" variant="soft">
              Event Cancelled
            </Chip>
          ) : event.isWindowOpen ? (
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
        breadcrumbs={[
          { label: "Back to Attendance Desk", href: "/attendance" },
          { label: event.title },
        ]}
        description={`${event.organizationName} · ${event.venueName} · ${new Date(event.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · ${new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(event.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        title={`Check-In Console: ${event.title}`}
      />

      {/* Check-In Window Alert */}
      {isCancelled ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Event Cancelled</Alert.Title>
            <Alert.Description>
              This event was cancelled by Student Affairs. Attendance verification is permanently disabled, while existing registration and attendance logs remain preserved for audit review.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : !event.isWindowOpen && !event.isWindowClosed ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Check-In Window Not Open Yet</Alert.Title>
            <Alert.Description>
              Per institutional rules (FR-13), attendance verification opens{" "}
              <strong>30 minutes prior to event start</strong> (
              {new Date(
                new Date(event.startTime).getTime() - 30 * 60000
              ).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              ). You can review the registered student roster below until check-in opens.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : event.isWindowClosed ? (
        <Alert status="default">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Check-In Window Closed</Alert.Title>
            <Alert.Description>
              This event has concluded. Attendance recording is locked; review final turnout below or open the Attendance Report to export CSV records.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {/* 4 Real-time Attendance & Audit KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/30 bg-surface p-4 flex flex-col justify-between gap-2">
          <span className="text-xs font-semibold text-muted">
            Confirmed Registrations
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-foreground tabular-nums">
              {totalRegistered}
            </span>
            <span className="text-xs text-muted">of {event.capacity} cap</span>
          </div>
        </Card>

        <Card className="border border-border/30 bg-surface p-4 flex flex-col justify-between gap-2">
          <span className="text-xs font-semibold text-muted">
            Attendees Checked In
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-success tabular-nums">
              {attendedCount}
            </span>
            <span className="text-xs text-success font-semibold">Verified</span>
          </div>
        </Card>

        <Card className="border border-border/30 bg-surface p-4 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">
              Participation Turnout
            </span>
            <span className="text-sm font-extrabold text-accent tabular-nums">
              {attendanceRate}%
            </span>
          </div>
          <ProgressBar
            aria-label="Participation turnout percentage"
            color={attendanceRate > 0 ? "success" : "default"}
            size="sm"
            value={attendanceRate}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        </Card>

        <Card className="border border-border/30 bg-surface p-4 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">
              Capacity Utilization
            </span>
            <span className="text-sm font-extrabold text-foreground tabular-nums">
              {capacityUtilization}%
            </span>
          </div>
          <ProgressBar
            aria-label="Venue capacity utilization percentage"
            color={
              capacityUtilization >= 100
                ? "danger"
                : capacityUtilization >= 80
                  ? "warning"
                  : "accent"
            }
            size="sm"
            value={capacityUtilization}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        </Card>
      </div>

      {/* Attendee Roster Table */}
      <Section as="h3" title="Attendee Roster & Verification">
        <ManualCheckinTable
          eventId={event.id}
          isWindowOpen={event.isWindowOpen && !isCancelled}
          roster={roster}
          onRefresh={() => router.refresh()}
        />
      </Section>

      {/* QR Scanner Modal */}
      {isScannerOpen ? (
        <QrScannerDialog
          eventId={event.id}
          isOpen={isScannerOpen}
          onOpenChange={setIsScannerOpen}
          onSuccess={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
