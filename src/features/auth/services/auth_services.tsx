// Browser-side Supabase auth calls for OrGanap (Django-style RBAC).
import type { ServiceResult } from "@/types";
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
import { mapSupabaseMutationError } from "@/utils/supabase/errors";

const ASSET_BUCKET = "organap-assets";

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

    const [profileRes, userGroupsRes, permsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, school_id, avatar_url, is_superuser, is_staff, is_active")
        .eq("id", baseUser.id)
        .maybeSingle(),
      supabase
        .from("user_groups")
        .select("groups(name)")
        .eq("user_id", baseUser.id),
      supabase.rpc("get_user_permissions", {
        p_user_id: baseUser.id,
      }),
    ]);

    const { data: profile, error } = profileRes;

    if (error) {
      console.error("Failed to fetch profile row:", error.message);
    }

    const groups: string[] = (userGroupsRes.data ?? [])
      .map((g) => (g.groups as { name: string } | null)?.name)
      .filter((name): name is string => typeof name === "string");

    const { data: permsData, error: permsError } = permsRes;

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

function getAuthSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");

  if (configured) {
    return configured;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "https://organap.vercel.app";
}

/** Sign up a new campus user with profile metadata. */
export async function signUpWithPassword(
  input: SignUpInput,
): Promise<SignUpResult> {
  const supabase = createClient();
  const emailRedirectTo = `${getAuthSiteUrl()}/auth/callback`;
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo,
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
  const redirectTo = `${getAuthSiteUrl()}/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo,
  });

  return toAuthError(error);
}

/** Update the user's password once signed in. */
export async function updateUserPassword(
  newPassword: string,
): Promise<AuthError | null> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return toAuthError(error);
}

/**
 * Upload a compressed profile avatar Blob into `organap-assets/avatars/<user_id>/...`.
 */
export async function uploadProfileAvatar(
  blob: Blob,
): Promise<ServiceResult<{ publicUrl: string }>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      data: null,
      error: { message: "Authentication required." },
    };
  }

  const ext = blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : "webp";
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const filePath = `avatars/${user.id}/avatar-${Date.now()}-${randomSuffix}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(ASSET_BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type || "image/webp",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return {
      success: false,
      data: null,
      error: { message: uploadError.message },
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from(ASSET_BUCKET)
    .getPublicUrl(filePath);

  return {
    success: true,
    data: { publicUrl: publicUrlData.publicUrl },
    error: null,
  };
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
    updated_at: string;
  };

  const patch: ProfileUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (input.displayName !== undefined && input.displayName !== null) {
    patch.display_name = input.displayName;
  }
  if (input.schoolId !== undefined) patch.school_id = input.schoolId;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);

  if (!error) return null;

  return {
    code: error.code,
    message: mapSupabaseMutationError(error, {
      entityLabel: "your profile",
      uniqueMessage: "That School / Student ID is already assigned to another account.",
    }),
  };
}
