// Auth feature types. Co-located per AGENTS.md.
import type { AuthUser, Permission, UserGroup } from "@/types";

export type { AuthUser, Permission, UserGroup };

export type AuthError = {
  message: string;
  code?: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  displayName: string;
  schoolId?: string;
};

export type UpdateProfileInput = {
  displayName?: string | null;
  schoolId?: string | null;
  avatarUrl?: string | null;
};

export type ResetPasswordInput = {
  email: string;
};

export type AuthResult<T> =
  | { data: T; error: null }
  | { data: null; error: AuthError };

export type SignUpResult =
  | { status: "signed_in"; user: AuthUser }
  | { status: "awaiting_confirmation"; error: null }
  | { status: "error"; error: AuthError };

export type ProfileOrgMembership = {
  organizationId: string;
  name: string;
  acronym: string;
  category: string;
  logoUrl: string | null;
  isActive: boolean;
  position: string | null;
  positionTitle: string | null;
  isOfficer: boolean;
  isAdviser: boolean;
};

export type ProfileStats = {
  registeredCount: number;
  attendedCount: number;
  proposalsCount: number;
};

export type PermissionSummary = {
  code: string;
  name: string;
  module: string;
};

export type ProfileOverview = {
  user: AuthUser;
  createdAt: string | null;
  updatedAt: string | null;
  organizations: ProfileOrgMembership[];
  stats: ProfileStats;
  permissionDetails: PermissionSummary[];
};
