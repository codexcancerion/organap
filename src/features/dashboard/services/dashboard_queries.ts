// Server-side queries for Dynamic Role-Adaptive Analytics Dashboard (FR-18).
import type {
  DashboardActionItem,
  DashboardMetrics,
  DashboardPassItem,
  DashboardUpcomingEvent,
} from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

export type DashboardViewer = {
  id: string;
  isStaff: boolean;
  isSuperuser: boolean;
  permissions: string[];
};

export const getDashboardMetrics = cache(async (
  viewer: DashboardViewer | string
): Promise<DashboardMetrics> => {
  const user: DashboardViewer =
    typeof viewer === "string"
      ? { id: viewer, isStaff: false, isSuperuser: false, permissions: [] }
      : viewer;

  const supabase = await createClient();
  const now = new Date().toISOString();
  const userId = user.id;

  const isSAOrSuper =
    user.isSuperuser ||
    user.isStaff ||
    user.permissions.includes("proposals.approve");

  const [officerMembershipsRes, governedOrgsRes, advisedOrgsRes] =
    await Promise.all([
      supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .eq("is_officer", true),
      supabase
        .from("organizations")
        .select("id")
        .eq("governor_id", userId),
      supabase
        .from("organizations")
        .select("id")
        .eq("adviser_id", userId),
    ]);

  const officerOrgIds = Array.from(
    new Set([
      ...(officerMembershipsRes.data ?? []).map((r) => r.organization_id),
      ...(governedOrgsRes.data ?? []).map((r) => r.id),
    ].filter(Boolean))
  );

  const adviserOrgIds = Array.from(
    new Set((advisedOrgsRes.data ?? []).map((r) => r.id).filter(Boolean))
  );

  const isAdviser =
    !isSAOrSuper &&
    (adviserOrgIds.length > 0 || user.permissions.includes("proposals.endorse"));
  const isOfficer =
    !isSAOrSuper &&
    (officerOrgIds.length > 0 || user.permissions.includes("proposals.create"));

  // Queries for KPI counts
  const endorsementCountQuery = isSAOrSuper
    ? supabase
        .from("event_proposals")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_adviser")
    : adviserOrgIds.length > 0
      ? supabase
          .from("event_proposals")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_adviser")
          .in("organization_id", adviserOrgIds)
      : null;

  const draftsCountQuery =
    officerOrgIds.length > 0
      ? supabase
          .from("event_proposals")
          .select("id", { count: "exact", head: true })
          .in("status", ["draft", "returned_by_adviser", "returned_by_student_affairs"])
          .in("organization_id", officerOrgIds)
      : supabase
          .from("event_proposals")
          .select("id", { count: "exact", head: true })
          .in("status", ["draft", "returned_by_adviser", "returned_by_student_affairs"])
          .eq("created_by", userId);

  // Scoped organization proposal IDs for officer registration/attendance counts (FR-18)
  const officerOrgProposalsRes =
    !isSAOrSuper && officerOrgIds.length > 0
      ? await supabase
          .from("event_proposals")
          .select("id")
          .in("organization_id", officerOrgIds)
      : null;

  const officerProposalIds = (officerOrgProposalsRes?.data ?? []).map((p) => p.id);

  // Action queue query based on highest authority scope
  const actionQueueQuery = isSAOrSuper
    ? supabase
        .from("event_proposals")
        .select("id, title, status, updated_at, organizations:organization_id(acronym)")
        .eq("status", "pending_student_affairs")
        .order("updated_at", { ascending: false })
        .limit(5)
    : isAdviser
      ? adviserOrgIds.length > 0
        ? supabase
            .from("event_proposals")
            .select("id, title, status, updated_at, organizations:organization_id(acronym)")
            .eq("status", "pending_adviser")
            .in("organization_id", adviserOrgIds)
            .order("updated_at", { ascending: false })
            .limit(5)
        : null
      : isOfficer
        ? officerOrgIds.length > 0
          ? supabase
              .from("event_proposals")
              .select("id, title, status, updated_at, organizations:organization_id(acronym)")
              .in("status", [
                "draft",
                "returned_by_adviser",
                "returned_by_student_affairs",
                "pending_adviser",
                "pending_student_affairs",
              ])
              .in("organization_id", officerOrgIds)
              .order("updated_at", { ascending: false })
              .limit(5)
          : supabase
              .from("event_proposals")
              .select("id, title, status, updated_at, organizations:organization_id(acronym)")
              .in("status", [
                "draft",
                "returned_by_adviser",
                "returned_by_student_affairs",
                "pending_adviser",
                "pending_student_affairs",
              ])
              .eq("created_by", userId)
              .order("updated_at", { ascending: false })
              .limit(5)
        : null;

  const [
    pendingApprovalsRes,
    awaitingEndorsementRes,
    myDraftsRes,
    myRegsRes,
    myAttendedRes,
    activeEventsRes,
    orgsRes,
    venuesRes,
    scopedRegsRes,
    scopedAttendedRes,
    upcomingEventsRes,
    actionQueueRes,
    recentPassesRes,
  ] = await Promise.all([
    supabase
      .from("event_proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_student_affairs"),

    endorsementCountQuery ?? Promise.resolve({ count: 0 }),

    draftsCountQuery,

    supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("status", "confirmed"),

    supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("status", "attended"),

    supabase
      .from("event_proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("end_time", now),

    supabase.from("organizations").select("id", { count: "exact", head: true }),

    supabase.from("venues").select("id", { count: "exact", head: true }),

    isSAOrSuper
      ? supabase
          .from("event_registrations")
          .select("id", { count: "exact", head: true })
          .in("status", ["confirmed", "attended"])
      : officerProposalIds.length > 0
        ? supabase
            .from("event_registrations")
            .select("id", { count: "exact", head: true })
            .in("proposal_id", officerProposalIds)
            .in("status", ["confirmed", "attended"])
        : Promise.resolve({ count: null }),

    isSAOrSuper
      ? supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
      : officerProposalIds.length > 0
        ? supabase
            .from("attendance_records")
            .select("id", { count: "exact", head: true })
            .in("proposal_id", officerProposalIds)
        : Promise.resolve({ count: null }),

    supabase
      .from("event_proposals")
      .select("id, title, start_time, capacity, organizations:organization_id(acronym), venues:venue_id(name)")
      .eq("status", "approved")
      .gte("end_time", now)
      .order("start_time", { ascending: true })
      .limit(4),

    actionQueueQuery ?? Promise.resolve({ data: [] }),

    supabase
      .from("event_registrations")
      .select("id, proposal_id, status, event:proposal_id(title, start_time, venues:venue_id(name))")
      .eq("student_id", userId)
      .in("status", ["confirmed", "attended"])
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const rawUpcoming = (upcomingEventsRes.data ?? []) as unknown as Array<{
    id: string;
    title: string;
    start_time: string;
    capacity: number;
    organizations: { acronym: string } | null;
    venues: { name: string } | null;
  }>;

  const countMap = new Map<string, number>();

  if (rawUpcoming.length > 0) {
    const { data: counts } = await supabase.rpc("get_event_registration_counts", {
      p_proposal_ids: rawUpcoming.map((e) => e.id),
    });

    for (const c of counts ?? []) {
      countMap.set(c.proposal_id, Number(c.registered_count ?? 0));
    }
  }

  const upcomingEvents: DashboardUpcomingEvent[] = rawUpcoming.map((e) => ({
    id: e.id,
    title: e.title,
    organizationAcronym: e.organizations?.acronym ?? "ORG",
    venueName: e.venues?.name ?? "Campus Venue",
    startTime: e.start_time,
    registeredCount: countMap.get(e.id) ?? 0,
    capacity: e.capacity,
  }));

  const rawActions = (actionQueueRes.data ?? []) as unknown as Array<{
    id: string;
    title: string;
    status: string;
    updated_at: string;
    organizations: { acronym: string } | null;
  }>;

  const actionQueue: DashboardActionItem[] = rawActions.map((a) => ({
    id: a.id,
    title: a.title,
    organizationAcronym: a.organizations?.acronym ?? "ORG",
    status: a.status,
    updatedAt: a.updated_at,
  }));

  const rawPasses = (recentPassesRes.data ?? []) as unknown as Array<{
    id: string;
    proposal_id: string;
    status: string;
    event: {
      title: string;
      start_time: string;
      venues: { name: string } | null;
    } | null;
  }>;

  const recentPasses: DashboardPassItem[] = rawPasses.map((p) => ({
    registrationId: p.id,
    eventId: p.proposal_id,
    eventTitle: p.event?.title ?? "Campus Event",
    venueName: p.event?.venues?.name ?? "Campus Venue",
    startTime: p.event?.start_time ?? "",
    status: p.status,
  }));

  const myRegistrations = myRegsRes.count ?? 0;
  const myAttended = myAttendedRes.count ?? 0;

  return {
    pendingApprovals: pendingApprovalsRes.count ?? 0,
    awaitingEndorsement: awaitingEndorsementRes.count ?? 0,
    myDraftProposals: myDraftsRes.count ?? 0,
    myRegistrations,
    myAttended,
    activeEvents: activeEventsRes.count ?? 0,
    recognizedOrgs: orgsRes.count ?? 0,
    campusVenues: venuesRes.count ?? 0,
    totalRegistrations:
      scopedRegsRes.count !== null && scopedRegsRes.count !== undefined
        ? scopedRegsRes.count
        : myRegistrations + myAttended,
    totalAttended:
      scopedAttendedRes.count !== null && scopedAttendedRes.count !== undefined
        ? scopedAttendedRes.count
        : myAttended,
    upcomingEvents,
    actionQueue,
    recentPasses,
  };
});
