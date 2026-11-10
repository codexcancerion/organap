export type AttendanceReportSummary = {
  id: string;
  proposalId: string;
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
  capacityUtilization: number;
  status: "completed" | "in_progress" | "upcoming";
};

export type ReportAttendeeRow = {
  registrationId: string;
  studentId: string;
  fullName: string;
  schoolId: string;
  email: string;
  registeredAt: string;
  attended: boolean;
  attendedAt: string | null;
  checkInMethod: "manual" | "qr_scanner" | null;
};

export type EventReportDetail = {
  summary: AttendanceReportSummary;
  attendees: ReportAttendeeRow[];
};
