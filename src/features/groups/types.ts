// Feature types for dynamic group and permission management in OrGanap.
import type { Permission, UserGroup } from "@/types";

export type AdminGroupListItem = UserGroup & {
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  permissionIds: string[];
};

export type CreateGroupInput = {
  name: string;
  description?: string | null;
};

export type UpdateGroupInput = {
  groupId: string;
  name: string;
  description?: string | null;
};

export type ToggleGroupPermissionInput = {
  groupId: string;
  permissionId: string;
  grant: boolean;
};

export type PermissionModuleGroup = {
  module: string;
  moduleLabel: string;
  permissions: Permission[];
};

export const PROTECTED_SYSTEM_GROUPS = [
  "Students",
  "Student Organization Officers",
  "Faculty Advisers",
  "Student Affairs",
] as const;

export type ProtectedSystemGroupName = (typeof PROTECTED_SYSTEM_GROUPS)[number];

export function isProtectedSystemGroup(name: string): boolean {
  return PROTECTED_SYSTEM_GROUPS.includes(name as ProtectedSystemGroupName);
}
