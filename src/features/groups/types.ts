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
  "Student",
  "Student Organization Officer",
  "Faculty Adviser",
  "Student Affairs",
] as const;

const LEGACY_PROTECTED_GROUP_NAMES = [
  "students",
  "student organization officers",
  "faculty advisers",
];

export type ProtectedSystemGroupName = (typeof PROTECTED_SYSTEM_GROUPS)[number];

export function isProtectedSystemGroup(name: string): boolean {
  const normalized = name.trim().toLowerCase();

  return (
    PROTECTED_SYSTEM_GROUPS.some((g) => g.toLowerCase() === normalized) ||
    LEGACY_PROTECTED_GROUP_NAMES.includes(normalized)
  );
}

export function isSystemGroupRecord(group: {
  name: string;
  isSystem?: boolean;
}): boolean {
  return Boolean(group.isSystem) || isProtectedSystemGroup(group.name);
}
