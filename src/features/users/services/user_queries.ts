// Server-side queries for User Management (App Router Server Components only).
import type { AdminUserListItem, AdminUserOrganization } from "@/features/users/types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

/**
 * Fetch all campus users with their profile data, email, organizations, and dynamic groups.
 * Cached per request.
 */
export const getAdminUsers = cache(async (): Promise<AdminUserListItem[]> => {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      email,
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
      ),
      organization_members (
        position,
        is_officer,
        organizations:organization_id (
          id,
          name,
          acronym
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

    const rawOrgs = p.organization_members as unknown as {
      position: string | null;
      is_officer: boolean;
      organizations: { id: string; name: string; acronym: string } | null;
    }[];

    const organizations: AdminUserOrganization[] = (rawOrgs ?? [])
      .filter((m) => Boolean(m.organizations))
      .map((m) => ({
        id: m.organizations!.id,
        name: m.organizations!.name,
        acronym: m.organizations!.acronym,
        position: m.position,
        isOfficer: m.is_officer,
      }));

    return {
      id: p.id,
      displayName: p.display_name,
      email: p.email,
      schoolId: p.school_id,
      avatarUrl: p.avatar_url,
      isSuperuser: p.is_superuser,
      isStaff: p.is_staff,
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      groups,
      organizations,
    };
  });
});
