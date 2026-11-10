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
