import type { AttendanceReportSummary, ReportAttendeeRow } from "../types";

/**
 * Escapes an RFC 4180 CSV field:
 * - If field contains comma, quote, or newline, it must be enclosed in double quotes.
 * - Any double quotes inside must be doubled ("").
 */
export function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  const escaped = str.replace(/"/g, '""');

  return `"${escaped}"`;
}

/**
 * Generates an RFC 4180 compliant CSV string for an event attendance report.
 * Uses CRLF (\r\n) row delimiters and UTF-8 Byte Order Mark (\uFEFF) for Excel compatibility.
 */
export function generateAttendanceReportCsv(
  summary: AttendanceReportSummary,
  attendees: ReportAttendeeRow[]
): string {
  const CRLF = "\r\n";
  const rows: string[] = [];

  // Metadata Header Block
  rows.push([escapeCsvField("EVENT ATTENDANCE AUDIT REPORT"), escapeCsvField("")].join(","));
  rows.push([escapeCsvField("Event Title"), escapeCsvField(summary.eventTitle)].join(","));
  rows.push([escapeCsvField("Organization"), escapeCsvField(`${summary.organizationName} (${summary.organizationAcronym})`)].join(","));
  rows.push([escapeCsvField("Venue"), escapeCsvField(summary.venueName)].join(","));
  rows.push([escapeCsvField("Schedule"), escapeCsvField(`${summary.startTime} to ${summary.endTime}`)].join(","));
  rows.push([escapeCsvField("Venue Capacity"), escapeCsvField(summary.capacity)].join(","));
  rows.push([escapeCsvField("Total Registered"), escapeCsvField(summary.totalRegistered)].join(","));
  rows.push([escapeCsvField("Total Attended"), escapeCsvField(summary.totalAttended)].join(","));
  rows.push([escapeCsvField("Attendance Rate"), escapeCsvField(`${summary.attendanceRate}%`)].join(","));
  rows.push([escapeCsvField("Generated At"), escapeCsvField(new Date().toISOString())].join(","));
  rows.push(""); // Blank row separator

  // Table Headers
  const headers = [
    escapeCsvField("Student Name"),
    escapeCsvField("School ID / Student Number"),
    escapeCsvField("Email Address"),
    escapeCsvField("Registration Date"),
    escapeCsvField("Attendance Status"),
    escapeCsvField("Check-In Timestamp"),
    escapeCsvField("Verification Method"),
  ];

  rows.push(headers.join(","));

  // Attendee Rows
  for (const a of attendees) {
    const row = [
      escapeCsvField(a.fullName),
      escapeCsvField(a.schoolId || "N/A"),
      escapeCsvField(a.email || "N/A"),
      escapeCsvField(a.registeredAt ? new Date(a.registeredAt).toLocaleString() : "N/A"),
      escapeCsvField(a.attended ? "Attended" : "Registered (Absent)"),
      escapeCsvField(a.attendedAt ? new Date(a.attendedAt).toLocaleString() : "N/A"),
      escapeCsvField(a.checkInMethod ? (a.checkInMethod === "qr_scanner" ? "QR Scanner" : "Manual Roster") : "N/A"),
    ];

    rows.push(row.join(","));
  }

  // Prepend UTF-8 BOM so Excel opens with proper character encoding
  return "\uFEFF" + rows.join(CRLF);
}

/**
 * Triggers a client-side download of a generated CSV string.
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
