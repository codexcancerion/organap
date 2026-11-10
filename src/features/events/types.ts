export type EventListItem = {
  id: string;
  title: string;
  purpose: string;
  organizationId: string;
  organizationName: string;
  organizationAcronym: string;
  venueId: string;
  venueName: string;
  venueLocation: string | null;
  venueCapacity: number;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
  registeredCount: number;
  isRegistered?: boolean;
  status: string;
};

export type EventDetail = EventListItem & {
  activitiesDesc: string;
  cancellationReason: string | null;
  createdAt: string;
};
