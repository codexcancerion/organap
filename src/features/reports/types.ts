export type AttendanceReportSummary = {
  proposalId: string;
  eventTitle: string;
  organizationName: string;
  venueName: string;
  totalRegistered: number;
  totalAttended: number;
  attendanceRate: number;
};
