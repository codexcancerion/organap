export type StudentPassItem = {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  organizationName: string;
  organizationAcronym: string;
  venueName: string;
  startTime: string;
  endTime: string;
  qrToken: string;
  status: "confirmed" | "withdrawn" | "attended";
  registeredAt: string;
};
