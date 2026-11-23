import type { AuthUser } from "@/types";

export type DashboardUpcomingEvent = {
  id: string;
  title: string;
  organizationAcronym: string;
  venueName: string;
  startTime: string;
  registeredCount: number;
  capacity: number;
};

export type DashboardActionItem = {
  id: string;
  title: string;
  organizationAcronym: string;
  status: string;
  updatedAt: string;
};

export type DashboardPassItem = {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  venueName: string;
  startTime: string;
  status: string;
};

export type DashboardMetrics = {
  pendingApprovals: number;
  awaitingEndorsement: number;
  myDraftProposals: number;
  myRegistrations: number;
  myAttended: number;
  activeEvents: number;
  recognizedOrgs: number;
  campusVenues: number;
  totalRegistrations?: number;
  totalAttended?: number;
  upcomingEvents?: DashboardUpcomingEvent[];
  actionQueue?: DashboardActionItem[];
  recentPasses?: DashboardPassItem[];
};

export type DashboardProps = {
  user: AuthUser;
  metrics: DashboardMetrics;
};
