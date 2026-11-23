import type { ProposalStatus } from "@/types/domain";

export type StudentPassItem = {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventStatus: ProposalStatus | string;
  registrationDeadline: string;
  organizationName: string;
  organizationAcronym: string;
  organizationLogoUrl: string | null;
  venueName: string;
  startTime: string;
  endTime: string;
  qrToken: string;
  status: "confirmed" | "withdrawn" | "attended";
  registeredAt: string;
  checkInAt: string | null;
  checkInMethod: "manual" | "qr_scanner" | null;
};
