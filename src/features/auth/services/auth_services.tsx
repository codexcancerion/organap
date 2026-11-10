// Browser-side Supabase auth calls for OrGanap (Django-style RBAC).
import type {
  AuthError,
  AuthResult,
  AuthUser,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  SignUpResult,
  UpdateProfileInput,
} from "@/features/auth/types";

import { createClient } from "@/utils/supabase/client";

function toAuthError(err: { message: string; code?: string } | null): AuthError | null {
  if (!err) return null;

  return { message: err.message, code: err.code ?? undefined };
}

/**
 * Hydrate a full `AuthUser` with Django-style groups and permissions.
 */
export async function hydrateAuthUser(
  baseUser: { id: string; email?: string | null } | null | undefined,
): Promise<AuthUser | null> {
  if (!baseUser?.id) return null;

  try {
    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, display_name, school_id, avatar_url, is_superuser, is_staff, is_active")
      .eq("id", baseUser.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch profile row:", error.message);
    }

    // Fetch user groups
    const { data: userGroups } = await supabase
      .from("user_groups")
      .select("groups(name)")
      .eq("user_id", baseUser.id);

    const groups: string[] = (userGroups ?? [])
      .map((g) => (g.groups as { name: string } | null)?.name)
      .filter((name): name is string => typeof name === "string");

    // Fetch effective permissions
    const { data: permsData, error: permsError } = await supabase.rpc("get_user_permissions", {
      p_user_id: baseUser.id,
    });

    if (permsError) {
      console.error("Failed to fetch user permissions:", permsError.message);
    }

    const permissions: string[] = (permsData ?? [])
      .map((p) => p.permission_code)
      .filter((code): code is string => typeof code === "string");

    return {
      id: baseUser.id,
      email: baseUser.email ?? "",
      displayName: profile?.display_name ? profile.display_name.trim() || null : null,
      schoolId: profile?.school_id ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      isSuperuser: profile?.is_superuser ?? false,
      isStaff: profile?.is_staff ?? false,
      isActive: profile?.is_active ?? true,
      groups,
      permissions,
    };
  } catch (err) {
    console.error("Error during profile hydration:", err);

    return {
      id: baseUser.id,
      email: baseUser.email ?? "",
      displayName: null,
      schoolId: null,
      avatarUrl: null,
      isSuperuser: false,
      isStaff: false,
      isActive: true,
      groups: [],
      permissions: [],
    };
  }
}

/** Sign in with email + password. */
export async function signInWithPassword(
  input: SignInInput,
): Promise<AuthResult<AuthUser>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);

  if (error || !data.user) {
    return {
      data: null,
      error: toAuthError(error) ?? { message: "Sign-in failed" },
    };
  }

  const user = await hydrateAuthUser(data.user);

  if (!user) {
    return {
      data: null,
      error: { message: "Failed to load user profile" },
    };
  }

  return { data: user, error: null };
}

/** Sign up a new campus user with profile metadata. */
export async function signUpWithPassword(
  input: SignUpInput,
): Promise<SignUpResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
        school_id: input.schoolId ?? null,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      error: toAuthError(error) ?? { message: "Sign-up failed" },
    };
  }

  if (data.session && data.user) {
    const user = await hydrateAuthUser(data.user);

    if (user) {
      return { status: "signed_in", user };
    }
  }

  return { status: "awaiting_confirmation", error: null };
}

/** Sign out the current session. */
export async function signOut(): Promise<void> {
  const supabase = createClient();

  await supabase.auth.signOut();
}

/** Request password recovery email. */
export async function requestPasswordReset(
  input: ResetPasswordInput,
): Promise<AuthError | null> {
  const supabase = createClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/reset-password`
      : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo,
  });

  return toAuthError(error);
}

/** Update the user's password once signed in via reset link. */
export async function updateUserPassword(
  newPassword: string,
): Promise<AuthError | null> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return toAuthError(error);
}

/** Update user profile (display name, avatar, school ID). */
export async function updateProfile(
  input: UpdateProfileInput,
): Promise<AuthError | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Not signed in" };
  }

  type ProfileUpdate = {
    display_name?: string;
    school_id?: string | null;
    avatar_url?: string | null;
  };

  const patch: ProfileUpdate = {};

  if (input.displayName !== undefined && input.displayName !== null) {
    patch.display_name = input.displayName;
  }
  if (input.schoolId !== undefined) patch.school_id = input.schoolId;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);

  return toAuthError(error);
}
