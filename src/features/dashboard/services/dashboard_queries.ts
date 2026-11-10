// Server-side queries for Dynamic Role-Adaptive Analytics Dashboard (FR-18).
import type { DashboardMetrics } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

export const getDashboardMetrics = cache(async (
  userId: string
): Promise<DashboardMetrics> => {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // WHY: { count: 'exact', head: true } asks PostgreSQL for COUNT(*) metadata without transferring
  // row bodies over the network, keeping initial role dashboard metrics ultra fast.
  const [
    pendingApprovalsRes,
    awaitingEndorsementRes,
    myDraftsRes,
    myRegsRes,
    myAttendedRes,
    activeEventsRes,
    orgsRes,
    venuesRes,
  ] = await Promise.all([
    // Student Affairs queue: endorsed proposals awaiting final approval
    supabase
      .from("event_proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", "adviser_endorsed"),

    // Faculty Adviser queue: proposals awaiting endorsement
    supabase
      .from("event_proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_adviser"),

    // Officer's draft or returned proposals
    supabase
      .from("event_proposals")
      .select("id", { count: "exact", head: true })
      .eq("created_by", userId)
      .in("status", ["draft", "returned"]),

    // Student's active registrations
    supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("status", "confirmed"),

    // Student's attended events
    supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("status", "attended"),

    // Active approved campus events
    supabase
      .from("event_proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("end_time", now),

    // Total active organizations
    supabase
      .from("organizations")
      .select("id", { count: "exact", head: true }),

    // Total campus venues
    supabase
      .from("venues")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    pendingApprovals: pendingApprovalsRes.count ?? 0,
    awaitingEndorsement: awaitingEndorsementRes.count ?? 0,
    myDraftProposals: myDraftsRes.count ?? 0,
    myRegistrations: myRegsRes.count ?? 0,
    myAttended: myAttendedRes.count ?? 0,
    activeEvents: activeEventsRes.count ?? 0,
    recognizedOrgs: orgsRes.count ?? 0,
    campusVenues: venuesRes.count ?? 0,
  };
});
