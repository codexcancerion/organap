// Domain and UI types for Student Organizations feature in OrGanap.
import type { ProposalListItem } from "@/types/domain";

export type {
  Organization,
  OrganizationCategory,
  OrganizationMember,
  ProposalListItem,
} from "@/types/domain";

export type OrganizationLeaderProfile = {
  id: string;
  fullName: string | null;
  displayName: string | null;
  schoolId: string | null;
  avatarUrl: string | null;
  email: string | null;
};

export type OrganizationMemberProfile = {
  id: string; // organization_members.id
  userId: string;
  fullName: string;
  displayName: string;
  schoolId: string | null;
  avatarUrl: string | null;
  email: string | null;
  position: string;
  isOfficer: boolean;
  isAdviser: boolean;
  joinedAt: string;
};

export type OrganizationListItem = {
  id: string;
  name: string;
  acronym: string;
  slug: string;
  description: string | null;
  category: string;
  logoUrl: string | null;
  isActive: boolean;
  governor: OrganizationLeaderProfile | null;
  adviser: OrganizationLeaderProfile | null;
  memberCount: number;
  eventsCount: number;
};

export type OrganizationDetailPermissions = {
  canViewOrganizations: boolean;
  canUpdateOwnOrganization: boolean;
  canUpdateAllOrganizations: boolean;
  canDeleteOrganizations: boolean;
  canCreateOrganizations: boolean;
  canEditThisOrg: boolean;
  canEditPositions: boolean;
  canManageMembers: boolean;
  canChangeLeaders: boolean;
  isCurrentGovernor: boolean;
  isCurrentAdviser: boolean;
};

export type OrganizationDetail = {
  id: string;
  name: string;
  acronym: string;
  slug: string;
  description: string | null;
  category: string;
  logoUrl: string | null;
  isActive: boolean;
  governor: OrganizationLeaderProfile | null;
  adviser: OrganizationLeaderProfile | null;
  members: OrganizationMemberProfile[];
  events: ProposalListItem[];
  canEditPositions: boolean;
  permissions: OrganizationDetailPermissions;
};

export type OrganizationFormValues = {
  name: string;
  acronym: string;
  slug?: string;
  category: string;
  description?: string;
  logoUrl?: string | null;
  governorId?: string | null;
  adviserId?: string | null;
  isActive?: boolean;
};

export type CandidateProfile = {
  id: string;
  fullName: string;
  displayName: string;
  schoolId: string | null;
  email: string | null;
  avatarUrl: string | null;
};
