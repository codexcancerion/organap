// Server-side data queries for Groups feature (App Router Server Components only).
import type { Permission } from "@/types";
import type { AdminGroupListItem } from "@/features/groups/types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

/**
 * Fetch all groups with their assigned permission IDs and member count.
 * Cached per request via React cache.
 */
export const getAdminGroups = cache(async (): Promise<AdminGroupListItem[]> => {
  const supabase = await createClient();

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select(`
      id,
      name,
      description,
      created_at,
      updated_at,
      group_permissions (permission_id),
      user_groups (count)
    `)
    .order("name", { ascending: true });

  if (groupsError) {
    console.error("Failed to fetch admin groups:", groupsError.message);

    return [];
  }

  return (groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
    permissionIds: (g.group_permissions ?? []).map((gp) => gp.permission_id),
    memberCount: (g.user_groups as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));
});

/**
 * Fetch all standard permissions across all modules.
 * Cached per request.
 */
export const getAllPermissions = cache(async (): Promise<Permission[]> => {
  const supabase = await createClient();

  const { data: permissions, error: permsError } = await supabase
    .from("permissions")
    .select("id, code, name, module, description")
    .order("module", { ascending: true })
    .order("code", { ascending: true });

  if (permsError) {
    console.error("Failed to fetch permissions:", permsError.message);

    return [];
  }

  return permissions ?? [];
});
