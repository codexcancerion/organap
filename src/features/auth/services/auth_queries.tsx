// Server-side auth queries for OrGanap.
import type { AppRole, AuthUser } from "@/types";

import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

/**
 * Resolve the current user (auth user + profile row) for the request scope.
 * Cached per request via React `cache`.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, display_name, school_id, avatar_url")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to fetch profile for auth user:", profileError.message);
  }

  const role: AppRole = (profile?.role as AppRole | undefined) ?? "student";

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    role,
    displayName: profile?.display_name ? profile.display_name.trim() || null : null,
    schoolId: profile?.school_id ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };
});
