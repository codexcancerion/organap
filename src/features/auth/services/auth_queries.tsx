// Server-side auth queries for OrGanap (Django-style RBAC).
import type { AuthUser } from "@/types";
import type {
  PermissionSummary,
  ProfileOrgMembership,
  ProfileOverview,
} from "../types";

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

type OrgMembershipQueryRow = {
  position: string | null;
  position_title: string | null;
  is_officer: boolean;
  is_adviser: boolean;
  organizations: {
    id: string;
    name: string;
    acronym: string;
    category: string;
    logo_url: string | null;
    is_active: boolean;
  } | null;
};

/**
 * Fetch enriched profile overview data for `/profile`:
 * profile timestamps, organization memberships, activity counts, and permission labels.
 */
export const getProfileOverview = cache(async (
  user: AuthUser,
): Promise<ProfileOverview> => {
  const supabase = await createClient();

  const [
    profileMetaRes,
    membershipsRes,
    ledOrgsRes,
    registrationsRes,
    attendedRes,
    proposalsRes,
    permissionsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("organization_members")
      .select(`
        position,
        position_title,
        is_officer,
        is_adviser,
        organizations:organization_id (
          id,
          name,
          acronym,
          category,
          logo_url,
          is_active
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("organizations")
      .select("id, name, acronym, category, logo_url, is_active, governor_id, adviser_id")
      .or(`governor_id.eq.${user.id},adviser_id.eq.${user.id}`),
    supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id)
      .in("status", ["confirmed", "attended"]),
    supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id)
      .eq("status", "attended"),
    supabase
      .from("event_proposals")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id),
    user.permissions.length > 0
      ? supabase
          .from("permissions")
          .select("code, name, module")
          .in("code", user.permissions)
          .order("module", { ascending: true })
          .order("code", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const rawMemberships = (membershipsRes.data ?? []) as unknown as OrgMembershipQueryRow[];
  const orgMap = new Map<string, ProfileOrgMembership>();

  for (const row of rawMemberships) {
    if (!row.organizations) continue;
    orgMap.set(row.organizations.id, {
      organizationId: row.organizations.id,
      name: row.organizations.name,
      acronym: row.organizations.acronym,
      category: row.organizations.category,
      logoUrl: row.organizations.logo_url,
      isActive: row.organizations.is_active,
      position: row.position,
      positionTitle: row.position_title,
      isOfficer: row.is_officer,
      isAdviser: row.is_adviser,
    });
  }

  for (const org of ledOrgsRes.data ?? []) {
    const existing = orgMap.get(org.id);
    const isGov = org.governor_id === user.id;
    const isAdv = org.adviser_id === user.id;

    orgMap.set(org.id, {
      organizationId: org.id,
      name: org.name,
      acronym: org.acronym,
      category: org.category,
      logoUrl: org.logo_url,
      isActive: org.is_active,
      position: existing?.position ?? (isGov ? "Governor" : isAdv ? "Adviser" : null),
      positionTitle: existing?.positionTitle ?? (isGov ? "Organization Governor" : isAdv ? "Faculty Adviser" : null),
      isOfficer: Boolean(existing?.isOfficer || isGov),
      isAdviser: Boolean(existing?.isAdviser || isAdv),
    });
  }

  const organizations = Array.from(orgMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const permissionDetails: PermissionSummary[] = (permissionsRes.data ?? []).map((p) => ({
    code: p.code,
    name: p.name,
    module: p.module,
  }));

  return {
    user,
    createdAt: profileMetaRes.data?.created_at ?? null,
    updatedAt: profileMetaRes.data?.updated_at ?? null,
    organizations,
    stats: {
      registeredCount: registrationsRes.count ?? 0,
      attendedCount: attendedRes.count ?? 0,
      proposalsCount: proposalsRes.count ?? 0,
    },
    permissionDetails,
  };
});
