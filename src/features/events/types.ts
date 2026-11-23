import type { ActivityType, EventAttachment, ProposalStatus } from "@/types/domain";

export { ACTIVITY_TYPE_LABELS } from "@/types/domain";
export type { ActivityType, EventAttachment };

export type EventListItem = {
  id: string;
  title: string;
  purpose: string;
  activityType?: string;
  semesterId?: string | null;
  semesterName?: string | null;
  organizationId: string;
  organizationName: string;
  organizationAcronym: string;
  organizationLogoUrl?: string | null;
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
  status: ProposalStatus | string;
  creatorName?: string | null;
};

export type EventDetail = EventListItem & {
  activitiesDesc: string;
  cancellationReason: string | null;
  createdAt: string;
  attachments?: EventAttachment[];
};
