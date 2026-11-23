// Pure RFC 4180 CSV generator and browser download helper for event attendance audits (FR-14).

export type AttendanceCsvEventSummary = {
  eventTitle: string;
  organizationName: string;
  organizationAcronym: string;
  venueName: string;
  startTime: string;
  endTime: string;
  capacity: number;
  totalRegistered: number;
  totalAttended: number;
  attendanceRate: number;
};

export type AttendanceCsvAttendeeRow = {
  fullName: string;
  schoolId: string;
  email: string;
  registeredAt: string;
  attended: boolean;
  attendedAt: string | null;
  checkInMethod: "manual" | "qr_scanner" | null;
};

/**
 * Escapes an RFC 4180 CSV field:
 * - Encloses fields in double quotes.
 * - Doubles any internal double quotes ("").
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
  summary: AttendanceCsvEventSummary,
  attendees: AttendanceCsvAttendeeRow[]
): string {
  const CRLF = "\r\n";
  const rows: string[] = [];

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
  rows.push("");

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

  for (const a of attendees) {
    const row = [
      escapeCsvField(a.fullName),
      escapeCsvField(a.schoolId || "N/A"),
      escapeCsvField(a.email || "N/A"),
      escapeCsvField(a.registeredAt ? new Date(a.registeredAt).toLocaleString() : "N/A"),
      escapeCsvField(a.attended ? "Attended" : "Registered (Absent)"),
      escapeCsvField(a.attendedAt ? new Date(a.attendedAt).toLocaleString() : "N/A"),
      escapeCsvField(
        a.checkInMethod
          ? a.checkInMethod === "qr_scanner"
            ? "QR Scanner"
            : "Manual Roster"
          : "N/A"
      ),
    ];

    rows.push(row.join(","));
  }

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
