import type {
  AttendanceCsvAttendeeRow,
  AttendanceCsvEventSummary,
} from "../attendance_csv";

import { describe, it, expect } from "vitest";

import {
  escapeCsvField,
  generateAttendanceReportCsv,
} from "../attendance_csv";

describe("RFC 4180 CSV Export Engine", () => {
  it("escapes fields with commas, newlines, and internal quotes", () => {
    expect(escapeCsvField('John "The Rock" Doe')).toBe('"John ""The Rock"" Doe"');
    expect(escapeCsvField("Room 101, Science Bldg")).toBe('"Room 101, Science Bldg"');
    expect(escapeCsvField(null)).toBe('""');
    expect(escapeCsvField(undefined)).toBe('""');
  });

  it("generates valid RFC 4180 CSV with UTF-8 BOM, headers, and CRLF separators", () => {
    const summary: AttendanceCsvEventSummary = {
      eventTitle: "Annual General Assembly",
      organizationName: "Computer Science Society",
      organizationAcronym: "CSS",
      venueName: "University Auditorium",
      startTime: "2026-11-20T08:00:00Z",
      endTime: "2026-11-20T12:00:00Z",
      capacity: 200,
      totalRegistered: 2,
      totalAttended: 1,
      attendanceRate: 50,
    };

    const attendees: AttendanceCsvAttendeeRow[] = [
      {
        fullName: "Dela Cruz, Juan",
        schoolId: "2026-0001",
        email: "juan@school.edu",
        registeredAt: "2026-11-15T10:00:00Z",
        attended: true,
        attendedAt: "2026-11-20T08:15:00Z",
        checkInMethod: "qr_scanner",
      },
      {
        fullName: 'Maria "Mia" Santos',
        schoolId: "2026-0002",
        email: "mia@school.edu",
        registeredAt: "2026-11-16T11:00:00Z",
        attended: false,
        attendedAt: null,
        checkInMethod: null,
      },
    ];

    const csv = generateAttendanceReportCsv(summary, attendees);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.includes("\r\n")).toBe(true);
    expect(csv.includes('"Dela Cruz, Juan"')).toBe(true);
    expect(csv.includes('"Maria ""Mia"" Santos"')).toBe(true);
    expect(csv.includes('"EVENT ATTENDANCE AUDIT REPORT"')).toBe(true);
    expect(csv.includes('"Student Name"')).toBe(true);
    expect(csv.includes('"Attended"')).toBe(true);
    expect(csv.includes('"Registered (Absent)"')).toBe(true);
  });
});
