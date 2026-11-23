// Server-side data queries for Events & Proposals catalog (FR-10, FR-16).
import type { ProposalStatus } from "@/types/domain";
import type { EventAttachment, EventDetail, EventListItem } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

type AttachmentQueryRow = {
  id: string;
  proposal_id: string;
  attachment_type_id: string | null;
  file_name: string;
  file_path: string;
  file_url: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
  attachment_type: { id: string; name: string; code: string; category: string | null } | null;
  uploader?: { id: string; full_name: string | null; display_name: string | null } | null;
};

type EventQueryRow = {
  id: string;
  title: string;
  purpose: string;
  activities_desc?: string | null;
  activity_type?: string | null;
  semester_id?: string | null;
  organization_id: string;
  venue_id: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  capacity: number;
  status: ProposalStatus;
  cancellation_reason?: string | null;
  created_at?: string;
  organizations: {
    id: string;
    name: string;
    acronym: string;
    logo_url?: string | null;
  } | null;
  venues: { id: string; name: string; location: string | null; capacity: number } | null;
  semesters?: { id: string; name: string } | null;
  creator?: { id: string; full_name: string | null; display_name: string | null } | null;
  registrations: { id: string; student_id: string; status: string }[];
  attachments?: AttachmentQueryRow[];
};

// WHY: Fetch aggregate active seat counts via security-definer RPC so students see live event
// capacity accurately across confirmed and attended rows without exposing peer registration records.
async function fetchRegistrationCountMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  proposalIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (proposalIds.length === 0) {
    return counts;
  }

  const { data, error } = await supabase.rpc("get_event_registration_counts", {
    p_proposal_ids: proposalIds,
  });

  if (error || !data) {
    return counts;
  }

  for (const item of data) {
    counts.set(item.proposal_id, Number(item.registered_count ?? 0));
  }

  return counts;
}

function mapEventQueryRow(
  row: EventQueryRow,
  currentUserId?: string,
  overrideRegisteredCount?: number
): EventListItem {
  const activeRegs = (row.registrations ?? []).filter(
    (r) => r.status === "confirmed" || r.status === "attended"
  );
  const isUserRegistered = currentUserId
    ? (row.registrations ?? []).some(
        (r) =>
          r.student_id === currentUserId &&
          (r.status === "confirmed" || r.status === "attended")
      )
    : false;

  return {
    id: row.id,
    title: row.title,
    purpose: row.purpose,
    activityType: row.activity_type ?? "seminar",
    semesterId: row.semester_id ?? null,
    semesterName: row.semesters?.name ?? null,
    organizationId: row.organization_id,
    organizationName: row.organizations?.name ?? "Campus Group",
    organizationAcronym: row.organizations?.acronym ?? "ORG",
    organizationLogoUrl: row.organizations?.logo_url ?? null,
    venueId: row.venue_id,
    venueName: row.venues?.name ?? "Campus Venue",
    venueLocation: row.venues?.location ?? null,
    venueCapacity: row.venues?.capacity ?? 0,
    startTime: row.start_time,
    endTime: row.end_time,
    registrationDeadline: row.registration_deadline,
    capacity: row.capacity,
    registeredCount: overrideRegisteredCount ?? activeRegs.length,
    isRegistered: isUserRegistered,
    status: row.status,
    creatorName: row.creator?.full_name || row.creator?.display_name || null,
  };
}

/**
 * Fetch unified events and visible proposals governed by PostgreSQL RLS policies.
 * Regular students receive approved/cancelled events; officers, advisers, and
 * Student Affairs also receive their visible drafts and pending/returned proposals.
 */
export const getEventsCatalog = cache(async (
  currentUserId?: string
): Promise<EventListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_proposals")
    .select(`
      id,
      title,
      purpose,
      activity_type,
      semester_id,
      organization_id,
      venue_id,
      start_time,
      end_time,
      registration_deadline,
      capacity,
      status,
      created_at,
      organizations:organization_id (id, name, acronym, logo_url),
      venues:venue_id (id, name, location, capacity),
      semesters:semester_id (id, name),
      creator:created_by (id, full_name, display_name),
      registrations:event_registrations (id, student_id, status)
    `)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Failed to fetch events catalog:", error.message);

    return [];
  }

  const rows = (data ?? []) as unknown as EventQueryRow[];
  const countMap = await fetchRegistrationCountMap(
    supabase,
    rows.map((r) => r.id)
  );

  return rows.map((row) =>
    mapEventQueryRow(row, currentUserId, countMap.get(row.id))
  );
});

/**
 * Fetch all approved events with live confirmed registration counts.
 * Excludes unapproved proposals from student listings (FR-10).
 */
export const getApprovedEvents = cache(async (
  currentUserId?: string
): Promise<EventListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_proposals")
    .select(`
      id,
      title,
      purpose,
      activity_type,
      semester_id,
      organization_id,
      venue_id,
      start_time,
      end_time,
      registration_deadline,
      capacity,
      status,
      organizations:organization_id (id, name, acronym, logo_url),
      venues:venue_id (id, name, location, capacity),
      semesters:semester_id (id, name),
      creator:created_by (id, full_name, display_name),
      registrations:event_registrations (id, student_id, status)
    `)
    .eq("status", "approved")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Failed to fetch approved events:", error.message);

    return [];
  }

  const rows = (data ?? []) as unknown as EventQueryRow[];
  const countMap = await fetchRegistrationCountMap(
    supabase,
    rows.map((r) => r.id)
  );

  return rows.map((row) =>
    mapEventQueryRow(row, currentUserId, countMap.get(row.id))
  );
});

/**
 * Fetch detail of an event by ID.
 */
export const getEventById = cache(async (
  id: string,
  currentUserId?: string
): Promise<EventDetail | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_proposals")
    .select(`
      id,
      title,
      purpose,
      activities_desc,
      activity_type,
      semester_id,
      organization_id,
      venue_id,
      start_time,
      end_time,
      registration_deadline,
      capacity,
      status,
      cancellation_reason,
      created_at,
      organizations:organization_id (id, name, acronym, logo_url),
      venues:venue_id (id, name, location, capacity),
      semesters:semester_id (id, name),
      registrations:event_registrations (id, student_id, status),
      attachments:event_attachments (
        id,
        proposal_id,
        attachment_type_id,
        file_name,
        file_path,
        file_url,
        mime_type,
        size_bytes,
        uploaded_by,
        created_at,
        attachment_type:attachment_type_id (id, name, code, category),
        uploader:uploaded_by (id, full_name, display_name)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as EventQueryRow;
  const countMap = await fetchRegistrationCountMap(supabase, [row.id]);
  const mapped = mapEventQueryRow(row, currentUserId, countMap.get(row.id));
  const attachments: EventAttachment[] = (row.attachments ?? [])
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((a) => ({
      id: a.id,
      proposalId: a.proposal_id,
      attachmentTypeId: a.attachment_type_id,
      attachmentTypeName: a.attachment_type?.name ?? null,
      attachmentTypeCode: a.attachment_type?.code ?? null,
      attachmentTypeCategory: a.attachment_type?.category ?? null,
      fileName: a.file_name,
      filePath: a.file_path,
      fileUrl: a.file_url,
      mimeType: a.mime_type,
      sizeBytes: a.size_bytes,
      uploadedBy: a.uploaded_by,
      uploadedByName: a.uploader?.full_name || a.uploader?.display_name || null,
      createdAt: a.created_at,
    }));

  return {
    ...mapped,
    activitiesDesc: row.activities_desc ?? "",
    cancellationReason: row.cancellation_reason ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    attachments,
  };
});
