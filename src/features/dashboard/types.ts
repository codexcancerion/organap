import type { AuthUser } from "@/types";

export type DashboardMetrics = {
  pendingApprovals: number;
  awaitingEndorsement: number;
  myDraftProposals: number;
  myRegistrations: number;
  myAttended: number;
  activeEvents: number;
  recognizedOrgs: number;
  campusVenues: number;
};

export type DashboardProps = {
  user: AuthUser;
  metrics: DashboardMetrics;
};
