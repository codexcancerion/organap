// Server-side queries for User Management (App Router Server Components only).
import type { AdminUserListItem } from "@/features/users/types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

/**
 * Fetch all campus users with their profile data and associated dynamic groups.
 * Cached per request.
 */
export const getAdminUsers = cache(async (): Promise<AdminUserListItem[]> => {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      school_id,
      avatar_url,
      is_superuser,
      is_staff,
      is_active,
      created_at,
      updated_at,
      user_groups (
        group_id,
        groups (
          id,
          name,
          description
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch admin users:", error.message);

    return [];
  }

  return (profiles ?? []).map((p) => {
    const rawUserGroups = p.user_groups as unknown as {
      group_id: string;
      groups: { id: string; name: string; description: string | null } | null;
    }[];

    const groups = (rawUserGroups ?? [])
      .map((ug) => ug.groups)
      .filter((g): g is { id: string; name: string; description: string | null } => Boolean(g));

    return {
      id: p.id,
      displayName: p.display_name,
      schoolId: p.school_id,
      avatarUrl: p.avatar_url,
      isSuperuser: p.is_superuser,
      isStaff: p.is_staff,
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      groups,
    };
  });
});
