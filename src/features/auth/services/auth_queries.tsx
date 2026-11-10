// Server-side auth queries for OrGanap (Django-style RBAC).
import type { AuthUser } from "@/types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

/**
 * Resolve the current user (auth user + profile + groups + effective permissions)
 * for the request scope. Cached per request via React `cache`.
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
    .select("id, display_name, school_id, avatar_url, is_superuser, is_staff, is_active")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to fetch profile for auth user:", profileError.message);
  }

  // Fetch groups
  const { data: userGroups } = await supabase
    .from("user_groups")
    .select("groups(name)")
    .eq("user_id", authUser.id);

  const groups: string[] = (userGroups ?? [])
    .map((g) => (g.groups as { name: string } | null)?.name)
    .filter((name): name is string => typeof name === "string");

  // Fetch effective permissions via Postgres RPC
  const { data: permsData, error: permsError } = await supabase.rpc("get_user_permissions", {
    p_user_id: authUser.id,
  });

  if (permsError) {
    console.error("Failed to fetch user permissions:", permsError.message);
  }

  const permissions: string[] = (permsData ?? [])
    .map((p) => p.permission_code)
    .filter((code): code is string => typeof code === "string");

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    displayName: profile?.display_name ? profile.display_name.trim() || null : null,
    schoolId: profile?.school_id ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    isSuperuser: profile?.is_superuser ?? false,
    isStaff: profile?.is_staff ?? false,
    isActive: profile?.is_active ?? true,
    groups,
    permissions,
  };
});
