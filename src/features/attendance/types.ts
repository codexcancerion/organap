export type AttendanceEventItem = {
  id: string;
  title: string;
  organizationId: string;
  organizationName: string;
  organizationAcronym: string;
  organizationLogoUrl: string | null;
  status: string;
  registrationDeadline: string;
  venueName: string;
  startTime: string;
  endTime: string;
  capacity: number;
  registeredCount: number;
  attendedCount: number;
  isWindowOpen: boolean;
  isWindowClosed: boolean;
};

export type AttendanceRosterItem = {
  registrationId: string;
  studentId: string;
  schoolId: string;
  fullName: string;
  email?: string;
  registeredAt?: string;
  qrToken: string;
  status: "confirmed" | "attended";
  checkInAt: string | null;
  checkInMethod: "manual" | "qr_scanner" | null;
};
