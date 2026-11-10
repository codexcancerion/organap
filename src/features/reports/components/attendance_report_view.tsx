"use client";

import type { EventReportDetail } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Card,
  Chip,
  Input,
  Button,
} from "@heroui/react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Search,
  Building,
  QrCode,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";
import { formatDate, formatTime } from "@/utils/formatters";

import { ReportExportButton } from "./report_export_button";

export type AttendanceReportViewProps = {
  report: EventReportDetail;
};

export function AttendanceReportView({ report }: AttendanceReportViewProps) {
  const { summary, attendees } = report;
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "attended" | "absent">("all");

  const filteredAttendees = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return attendees.filter((a) => {
      const matchesSearch =
        !q ||
        a.fullName.toLowerCase().includes(q) ||
        a.schoolId.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q);

      const matchesStatus =
        filter === "all" ||
        (filter === "attended" && a.attended) ||
        (filter === "absent" && !a.attended);

      return matchesSearch && matchesStatus;
    });
  }, [attendees, search, filter]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <NextLink
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors w-fit"
        href="/reports"
      >
        <ArrowLeft size={14} />
        Back to Reports
      </NextLink>

      <PageHeader
        actions={
          <ReportExportButton
            attendees={attendees}
            summary={summary}
            variant="primary"
          />
        }
        description={`Participation & attendance audit for ${summary.organizationName} (${summary.organizationAcronym})`}
        title={summary.eventTitle}
      />

      {/* Event Meta Details Card */}
      <Card className="p-4 border border-divider bg-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="text-muted shrink-0" size={16} />
            <div>
              <span className="text-muted block text-[11px]">Event Date</span>
              <span className="font-medium text-foreground">{formatDate(summary.startTime)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="text-muted shrink-0" size={16} />
            <div>
              <span className="text-muted block text-[11px]">Time Window</span>
              <span className="font-medium text-foreground">
                {formatTime(summary.startTime)} - {formatTime(summary.endTime)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin className="text-muted shrink-0" size={16} />
            <div>
              <span className="text-muted block text-[11px]">Venue</span>
              <span className="font-medium text-foreground truncate">{summary.venueName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Building className="text-muted shrink-0" size={16} />
            <div>
              <span className="text-muted block text-[11px]">Audit Status</span>
              <Chip
                color={summary.status === "completed" ? "default" : "success"}
                size="sm"
                variant="soft"
              >
                {summary.status === "completed" ? "Completed" : "Active"}
              </Chip>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-divider bg-card">
          <span className="text-xs text-muted block mb-1">Registered Students</span>
          <span className="text-2xl font-bold text-foreground">{summary.totalRegistered}</span>
          <span className="text-[11px] text-muted block mt-1">Confirmed signups</span>
        </Card>
        <Card className="p-4 border border-divider bg-card">
          <span className="text-xs text-muted block mb-1">Attended</span>
          <span className="text-2xl font-bold text-success">{summary.totalAttended}</span>
          <span className="text-[11px] text-muted block mt-1">Verified check-ins</span>
        </Card>
        <Card className="p-4 border border-divider bg-card">
          <span className="text-xs text-muted block mb-1">Turnout Rate</span>
          <span className="text-2xl font-bold text-primary">{summary.attendanceRate}%</span>
          <span className="text-[11px] text-muted block mt-1">Attended / Registered</span>
        </Card>
        <Card className="p-4 border border-divider bg-card">
          <span className="text-xs text-muted block mb-1">Capacity Utilization</span>
          <span className="text-2xl font-bold text-foreground">{summary.capacityUtilization}%</span>
          <span className="text-[11px] text-muted block mt-1">Of {summary.capacity} max seats</span>
        </Card>
      </div>

      {/* Attendee Roster Section */}
      <Card className="p-5 border border-divider bg-card">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="w-full sm:max-w-sm relative">
            <Input
              aria-label="Search attendees"
              className="pl-9"
              placeholder="Search by name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={15} />
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Button
              size="sm"
              variant={filter === "all" ? "primary" : "ghost"}
              onPress={() => setFilter("all")}
            >
              All ({attendees.length})
            </Button>
            <Button
              size="sm"
              variant={filter === "attended" ? "primary" : "ghost"}
              onPress={() => setFilter("attended")}
            >
              Attended ({attendees.filter((a) => a.attended).length})
            </Button>
            <Button
              size="sm"
              variant={filter === "absent" ? "primary" : "ghost"}
              onPress={() => setFilter("absent")}
            >
              Absent ({attendees.filter((a) => !a.attended).length})
            </Button>
          </div>
        </div>

        {filteredAttendees.length === 0 ? (
          <div className="text-center py-10 text-muted text-sm">
            No attendees match the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-divider text-muted uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Registration Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Verification Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/50">
                {filteredAttendees.map((a) => (
                  <tr key={a.registrationId} className="hover:bg-default-50/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-foreground">
                      {a.fullName}
                    </td>
                    <td className="py-3 px-3 text-muted">
                      {a.schoolId || "—"}
                    </td>
                    <td className="py-3 px-3 text-muted">
                      {a.email || "—"}
                    </td>
                    <td className="py-3 px-3 text-muted">
                      {a.registeredAt ? new Date(a.registeredAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 px-3">
                      {a.attended ? (
                        <Chip color="success" size="sm" variant="soft">
                          <span className="flex items-center gap-1 font-medium">
                            <CheckCircle2 size={12} /> Attended
                          </span>
                        </Chip>
                      ) : (
                        <Chip color="default" size="sm" variant="soft">
                          Absent
                        </Chip>
                      )}
                    </td>
                    <td className="py-3 px-3 text-muted">
                      {a.attended ? (
                        <div className="flex items-center gap-1.5">
                          {a.checkInMethod === "qr_scanner" ? (
                            <QrCode className="text-primary" size={13} />
                          ) : (
                            <Users className="text-muted" size={13} />
                          )}
                          <span>
                            {a.attendedAt ? formatTime(a.attendedAt) : "Checked in"}
                            {" · "}
                            {a.checkInMethod === "qr_scanner" ? "QR Scan" : "Manual"}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
