// Feature types for User Directory & Management in OrGanap.
import type { UserGroup, UserProfile } from "@/types";

export type AdminUserListItem = UserProfile & {
  groups: UserGroup[];
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
