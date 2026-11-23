// Feature types for User Directory & Management in OrGanap.
import type { UserGroup, UserProfile } from "@/types";

export type AdminUserOrganization = {
  id: string;
  name: string;
  acronym: string;
  position: string | null;
  isOfficer: boolean;
};

export type AdminUserListItem = UserProfile & {
  email?: string | null;
  groups: UserGroup[];
  organizations?: AdminUserOrganization[];
};

export type UpdateUserProfileInput = {
  userId: string;
  displayName?: string;
  schoolId?: string | null;
  isActive?: boolean;
  isStaff?: boolean;
  isSuperuser?: boolean;
};

export type AssignUserGroupInput = {
  userId: string;
  groupId: string;
};

export type UserFilterOptions = {
  searchQuery: string;
  selectedGroup: string;
  statusFilter: "all" | "active" | "inactive" | "staff" | "superuser";
};
