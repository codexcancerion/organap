// Server-side data queries for Proposals feature (App Router Server Components only).
import type { ProposalListItem, ProposalDetail } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

type ReviewQueryRow = {
  id: string;
  stage: "adviser" | "student_affairs";
  decision: "endorsed" | "approved" | "returned_for_revision" | "rejected";
  remarks: string | null;
  created_at: string;
  reviewer: { full_name: string | null; school_id: string | null } | null;
};

type ProposalQueryRow = {
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
  organizations: { name: string; acronym: string } | null;
  venues: { name: string; capacity: number } | null;
  creator: { full_name: string | null } | null;
  reviews: ReviewQueryRow[];
};

/**
 * Fetch list of event proposals based on user visibility.
 * Cached per request.
 */
export const getProposals = cache(async (filter?: {
  status?: string;
  organizationId?: string;
}): Promise<ProposalListItem[]> => {
  const supabase = await createClient();

  let query = supabase
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
      organizations:organization_id (id, name, acronym),
      venues:venue_id (id, name, capacity),
      creator:created_by (id, full_name, school_id)
    `)
    .order("created_at", { ascending: false });

  if (filter?.status && filter.status !== "all") {
    query = query.eq("status", filter.status);
  }

  if (filter?.organizationId) {
    query = query.eq("organization_id", filter.organizationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch proposals:", error.message);

    return [];
  }

  const rows = (data ?? []) as unknown as ProposalQueryRow[];

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    purpose: row.purpose,
    organizationId: row.organization_id,
    organizationName: row.organizations?.name ?? "Unknown Organization",
    organizationAcronym: row.organizations?.acronym ?? "ORG",
    venueId: row.venue_id,
    venueName: row.venues?.name ?? "TBD",
    venueCapacity: row.venues?.capacity ?? 0,
    startTime: row.start_time,
    endTime: row.end_time,
    registrationDeadline: row.registration_deadline,
    capacity: row.capacity,
    status: row.status,
    cancellationReason: row.cancellation_reason,
    createdById: row.created_by,
    creatorName: row.creator?.full_name ?? "System",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
});

/**
 * Fetch a single proposal with its complete review timeline and details.
 */
export const getProposalById = cache(async (id: string): Promise<ProposalDetail | null> => {
  const supabase = await createClient();

  const { data: row, error } = await supabase
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
      organizations:organization_id (id, name, acronym),
      venues:venue_id (id, name, capacity),
      creator:created_by (id, full_name, school_id),
      reviews:proposal_reviews (
        id,
        stage,
        decision,
        remarks,
        created_at,
        reviewer:reviewer_id (id, full_name, school_id)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !row) {
    return null;
  }

  const typedRow = row as unknown as ProposalQueryRow;

  const sortedReviews = (typedRow.reviews ?? []).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return {
    id: typedRow.id,
    title: typedRow.title,
    purpose: typedRow.purpose,
    activitiesDesc: typedRow.activities_desc,
    organizationId: typedRow.organization_id,
    organizationName: typedRow.organizations?.name ?? "Unknown Organization",
    organizationAcronym: typedRow.organizations?.acronym ?? "ORG",
    venueId: typedRow.venue_id,
    venueName: typedRow.venues?.name ?? "TBD",
    venueCapacity: typedRow.venues?.capacity ?? 0,
    startTime: typedRow.start_time,
    endTime: typedRow.end_time,
    registrationDeadline: typedRow.registration_deadline,
    capacity: typedRow.capacity,
    status: typedRow.status,
    cancellationReason: typedRow.cancellation_reason,
    createdById: typedRow.created_by,
    creatorName: typedRow.creator?.full_name ?? "System",
    createdAt: typedRow.created_at,
    updatedAt: typedRow.updated_at,
    reviews: sortedReviews.map((r) => ({
      id: r.id,
      stage: r.stage,
      decision: r.decision,
      remarks: r.remarks,
      reviewerName: r.reviewer?.full_name ?? "Staff",
      reviewerSchoolId: r.reviewer?.school_id ?? null,
      createdAt: r.created_at,
    })),
  };
});

/**
 * Fetch available organizations and active venues for the proposal creation form.
 */
export const getProposalFormData = cache(async (_userId: string) => {
  const supabase = await createClient();

  const [orgsRes, venuesRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, acronym")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("venues")
      .select("id, name, capacity, location")
      .eq("is_active", true)
      .order("name"),
  ]);

  return {
    organizations: orgsRes.data ?? [],
    venues: venuesRes.data ?? [],
  };
});
