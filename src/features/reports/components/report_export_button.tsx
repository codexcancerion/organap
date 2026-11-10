"use client";

import type { AttendanceReportSummary, ReportAttendeeRow } from "../types";

import React from "react";
import { Button } from "@heroui/react";
import { Download } from "lucide-react";
import { toast } from "@heroui/react";

import {
  generateAttendanceReportCsv,
  downloadCsvFile,
} from "../services/report_export_services";

export type ReportExportButtonProps = {
  summary: AttendanceReportSummary;
  attendees: ReportAttendeeRow[];
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "tertiary" | "outline";
  className?: string;
};

export function ReportExportButton({
  summary,
  attendees,
  size = "md",
  variant = "secondary",
  className,
}: ReportExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = () => {
    try {
      setIsExporting(true);
      const csv = generateAttendanceReportCsv(summary, attendees);
      const sanitizedTitle = summary.eventTitle
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();
      const filename = `attendance_report_${sanitizedTitle}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      downloadCsvFile(filename, csv);
      toast.success("Report exported successfully (RFC 4180 CSV)");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";

      toast.danger("Failed to export report: " + msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      className={className}
      isDisabled={isExporting}
      size={size}
      variant={variant}
      onPress={handleExport}
    >
      <Download size={15} />
      {isExporting ? "Exporting..." : "Export CSV (RFC 4180)"}
    </Button>
  );
}
