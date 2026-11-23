// Server-side data queries for Student Organizations (FR-01, FR-02).
import type {
  OrganizationListItem,
  OrganizationDetail,
  OrganizationMemberProfile,
  CandidateProfile,
  OrganizationDetailPermissions,
} from "../types";
import type { ProposalListItem } from "@/types/domain";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

type OrgQueryRow = {
  id: string;
  name: string;
  acronym: string;
  slug: string;
  description: string | null;
  category: string;
  logo_url: string | null;
  is_active: boolean;
  governor_id: string | null;
  adviser_id: string | null;
  governor: {
    id: string;
    display_name: string;
    full_name: string | null;
    school_id: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  adviser: {
    id: string;
    display_name: string;
    full_name: string | null;
    school_id: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  members: { id: string }[];
  events: { id: string }[];
};

type OrgMemberQueryRow = {
  id: string;
  user_id: string;
  position: string | null;
  position_title: string | null;
  is_officer: boolean;
  is_adviser: boolean;
  created_at: string;
  profile: {
    id: string;
    display_name: string;
    full_name: string | null;
    school_id: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
};

type OrgProposalQueryRow = {
  id: string;
  title: string;
  purpose: string;
  activities_desc: string;
  organization_id: string;
  venue_id: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  capacity: number;
  status: ProposalListItem["status"];
  cancellation_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  venues: { name: string; capacity: number } | null;
  creator: { full_name: string | null } | null;
};

/**
 * Fetch all organizations with their member count, events count, governor, and adviser.
 */
export const getOrganizations = cache(async (): Promise<OrganizationListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select(`
      id,
      name,
      acronym,
      slug,
      description,
      category,
      logo_url,
      is_active,
      governor_id,
      adviser_id,
      governor:governor_id (id, display_name, full_name, school_id, avatar_url, email),
      adviser:adviser_id (id, display_name, full_name, school_id, avatar_url, email),
      members:organization_members (id),
      events:event_proposals (id)
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch organizations:", error.message);

    return [];
  }

  const rows = (data ?? []) as unknown as OrgQueryRow[];

  return rows.map((org) => ({
    id: org.id,
    name: org.name,
    acronym: org.acronym,
    slug: org.slug,
    description: org.description,
    category: org.category,
    logoUrl: org.logo_url,
    isActive: org.is_active,
    governor: org.governor
      ? {
          id: org.governor.id,
          fullName: org.governor.full_name || org.governor.display_name,
          displayName: org.governor.display_name,
          schoolId: org.governor.school_id,
          avatarUrl: org.governor.avatar_url,
          email: org.governor.email,
        }
      : null,
    adviser: org.adviser
      ? {
          id: org.adviser.id,
          fullName: org.adviser.full_name || org.adviser.display_name,
          displayName: org.adviser.display_name,
          schoolId: org.adviser.school_id,
          avatarUrl: org.adviser.avatar_url,
          email: org.adviser.email,
        }
      : null,
    memberCount: org.members?.length ?? 0,
    eventsCount: org.events?.length ?? 0,
  }));
});

/**
 * Fetch a single organization detail with governor, adviser, members, and events.
 * Also evaluates granular permissions for the viewing user.
 */
export const getOrganizationById = cache(
  async (
    id: string,
    viewerUserId?: string | null,
    viewerPerms: { isSuperuser?: boolean; isStaff?: boolean; permissions?: string[] } = {}
  ): Promise<OrganizationDetail | null> => {
    const supabase = await createClient();

    const [orgRes, membersRes, eventsRes] = await Promise.all([
      supabase
        .from("organizations")
        .select(`
          id,
          name,
          acronym,
          slug,
          description,
          category,
          logo_url,
          is_active,
          governor_id,
          adviser_id,
          governor:governor_id (id, display_name, full_name, school_id, avatar_url, email),
          adviser:adviser_id (id, display_name, full_name, school_id, avatar_url, email)
        `)
        .eq("id", id)
        .single(),

      supabase
        .from("organization_members")
        .select(`
          id,
          user_id,
          position,
          position_title,
          is_officer,
          is_adviser,
          created_at,
          profile:user_id (id, display_name, full_name, school_id, avatar_url, email)
        `)
        .eq("organization_id", id)
        .order("created_at", { ascending: true }),

      supabase
        .from("event_proposals")
        .select(`
          id,
          title,
          purpose,
          activities_desc,
          organization_id,
          venue_id,
          start_time,
          end_time,
          registration_deadline,
          capacity,
          status,
          cancellation_reason,
          created_by,
          created_at,
          updated_at,
          venues:venue_id (name, capacity),
          creator:created_by (full_name)
        `)
        .eq("organization_id", id)
        .order("start_time", { ascending: false }),
    ]);

    if (orgRes.error || !orgRes.data) {
      return null;
    }

    const row = orgRes.data as unknown as OrgQueryRow;
    const memberRows = (membersRes.data ?? []) as unknown as OrgMemberQueryRow[];
    const eventRows = (eventsRes.data ?? []) as unknown as OrgProposalQueryRow[];

    const members: OrganizationMemberProfile[] = memberRows.map((m) => ({
      id: m.id,
      userId: m.user_id,
      fullName: m.profile?.full_name || m.profile?.display_name || "Member",
      displayName: m.profile?.display_name || "Member",
      schoolId: m.profile?.school_id ?? null,
      avatarUrl: m.profile?.avatar_url ?? null,
      email: m.profile?.email ?? null,
      position: m.position || m.position_title || "Member",
      isOfficer: m.is_officer,
      isAdviser: m.is_adviser,
      joinedAt: m.created_at,
    }));

    const events: ProposalListItem[] = eventRows.map((e) => ({
      id: e.id,
      title: e.title,
      purpose: e.purpose,
      organizationId: e.organization_id,
      organizationName: row.name,
      organizationAcronym: row.acronym,
      venueId: e.venue_id,
      venueName: e.venues?.name ?? "TBD",
      venueCapacity: e.venues?.capacity ?? 0,
      startTime: e.start_time,
      endTime: e.end_time,
      registrationDeadline: e.registration_deadline,
      capacity: e.capacity,
      status: e.status,
      cancellationReason: e.cancellation_reason,
      createdById: e.created_by,
      creatorName: e.creator?.full_name ?? "Officer",
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    }));

    // Permission evaluation
    const isSuperuser = !!viewerPerms.isSuperuser;
    const isStaff = !!viewerPerms.isStaff;
    const userPerms = viewerPerms.permissions ?? [];

    const hasPerm = (code: string) => isSuperuser || userPerms.includes(code);

    const isCurrentGovernor = !!viewerUserId && viewerUserId === row.governor_id;
    const isCurrentAdviser = !!viewerUserId && viewerUserId === row.adviser_id;
    const isOwnLeader = isCurrentGovernor || isCurrentAdviser;

    const canViewOrganizations = true; // authenticated users can browse
    const canCreateOrganizations = isSuperuser || isStaff || hasPerm("organizations.create");
    const canUpdateAllOrganizations =
      isSuperuser || isStaff || hasPerm("organizations.change_all") || hasPerm("organizations.change");
    const canUpdateOwnOrganization =
      canUpdateAllOrganizations || (hasPerm("organizations.change_own") && isOwnLeader) || isOwnLeader;
    const canDeleteOrganizations = isSuperuser || isStaff || hasPerm("organizations.delete");

    const canEditThisOrg = canUpdateAllOrganizations || (canUpdateOwnOrganization && isOwnLeader);
    const canEditPositions = canEditThisOrg;
    const canManageMembers = canEditThisOrg;
    const canChangeLeaders = canEditThisOrg;

    const permissions: OrganizationDetailPermissions = {
      canViewOrganizations,
      canUpdateOwnOrganization,
      canUpdateAllOrganizations,
      canDeleteOrganizations,
      canCreateOrganizations,
      canEditThisOrg,
      canEditPositions,
      canManageMembers,
      canChangeLeaders,
      isCurrentGovernor,
      isCurrentAdviser,
    };

    return {
      id: row.id,
      name: row.name,
      acronym: row.acronym,
      slug: row.slug,
      description: row.description,
      category: row.category,
      logoUrl: row.logo_url,
      isActive: row.is_active,
      governor: row.governor
        ? {
            id: row.governor.id,
            fullName: row.governor.full_name || row.governor.display_name,
            displayName: row.governor.display_name,
            schoolId: row.governor.school_id,
            avatarUrl: row.governor.avatar_url,
            email: row.governor.email,
          }
        : null,
      adviser: row.adviser
        ? {
            id: row.adviser.id,
            fullName: row.adviser.full_name || row.adviser.display_name,
            displayName: row.adviser.display_name,
            schoolId: row.adviser.school_id,
            avatarUrl: row.adviser.avatar_url,
            email: row.adviser.email,
          }
        : null,
      members,
      events,
      canEditPositions,
      permissions,
    };
  }
);

/**
 * Fetch candidate user profiles to populate Governor / Adviser or Member selection dropdowns.
 */
export const getCandidateProfiles = cache(async (): Promise<CandidateProfile[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, school_id, email, avatar_url")
    .eq("is_active", true)
    .order("display_name", { ascending: true });

  if (error) {
    console.error("Failed to fetch candidate profiles:", error.message);

    return [];
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name || p.display_name || "User",
    displayName: p.display_name || "User",
    schoolId: p.school_id,
    email: p.email,
    avatarUrl: p.avatar_url,
  }));
});
