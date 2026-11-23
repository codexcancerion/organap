// Server-side data queries for Proposals feature (App Router Server Components only).
import type {
  AttachmentType,
  EventAttachment,
  ProposalDetail,
  ProposalListItem,
  ProposalSemesterOption,
} from "../types";

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

type ProposalQueryRow = {
  id: string;
  title: string;
  purpose: string;
  activities_desc: string | null;
  activity_type: string;
  semester_id: string | null;
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
  organizations: {
    name: string;
    acronym: string;
    governor_id?: string | null;
    adviser_id?: string | null;
  } | null;
  venues: { name: string; capacity: number } | null;
  semesters: { id: string; name: string } | null;
  creator: { full_name: string | null } | null;
  reviews: ReviewQueryRow[];
  attachments?: AttachmentQueryRow[];
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
      created_by,
      created_at,
      updated_at,
      organizations:organization_id (id, name, acronym),
      venues:venue_id (id, name, capacity),
      semesters:semester_id (id, name),
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
    activityType: row.activity_type,
    semesterId: row.semester_id,
    semesterName: row.semesters?.name ?? null,
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
 * Fetch a single proposal with its complete review timeline, attachments, and details.
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
      created_by,
      created_at,
      updated_at,
      organizations:organization_id (id, name, acronym, governor_id, adviser_id),
      venues:venue_id (id, name, capacity),
      semesters:semester_id (id, name),
      creator:created_by (id, full_name, school_id),
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
      ),
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

  const attachments: EventAttachment[] = (typedRow.attachments ?? [])
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
    id: typedRow.id,
    title: typedRow.title,
    purpose: typedRow.purpose,
    activitiesDesc: typedRow.activities_desc ?? "",
    activityType: typedRow.activity_type,
    semesterId: typedRow.semester_id,
    semesterName: typedRow.semesters?.name ?? null,
    organizationId: typedRow.organization_id,
    organizationName: typedRow.organizations?.name ?? "Unknown Organization",
    organizationAcronym: typedRow.organizations?.acronym ?? "ORG",
    organizationGovernorId: typedRow.organizations?.governor_id ?? null,
    organizationAdviserId: typedRow.organizations?.adviser_id ?? null,
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
    attachments,
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
 * Resolve the current user's membership and leadership roles within a host organization
 * so fellow organization members can collaborate on drafts, revisions, and uploads.
 */
export const getProposalCollaborationAccess = cache(
  async (organizationId: string, userId: string) => {
    const supabase = await createClient();

    const [{ data: memberRow }, { data: orgRow }] = await Promise.all([
      supabase
        .from("organization_members")
        .select("is_officer, is_adviser")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("organizations")
        .select("governor_id, adviser_id")
        .eq("id", organizationId)
        .maybeSingle(),
    ]);

    const isOrgGovernor = orgRow?.governor_id === userId;
    const isOrgDirectAdviser = orgRow?.adviser_id === userId;
    const isOrgOfficerOrGovernor = Boolean(memberRow?.is_officer) || isOrgGovernor;
    const isOrgAdviser = Boolean(memberRow?.is_adviser) || isOrgDirectAdviser;
    const isOrgMember = Boolean(memberRow) || isOrgGovernor || isOrgDirectAdviser;

    return {
      isOrgMember,
      isOrgOfficerOrGovernor,
      isOrgAdviser,
    };
  },
);

/**
 * Fetch available organizations, active venues, semesters, and dynamic attachment types
 * for the proposal creation and revision form.
 */
export const getProposalFormData = cache(async (userId: string) => {
  const supabase = await createClient();

  const [orgsRes, venuesRes, semestersRes, attachmentTypesRes, profileRes, memberRes] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, acronym, governor_id, adviser_id")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("venues")
        .select("id, name, capacity, location")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("semesters")
        .select("id, name, start_date, end_date")
        .order("start_date", { ascending: false }),
      supabase
        .from("attachment_types")
        .select(
          "id, name, code, category, description, is_required, is_active, template_file_name, template_file_path, template_file_url, created_at, updated_at",
        )
        .eq("is_active", true)
        .order("is_required", { ascending: false })
        .order("name", { ascending: true }),
      supabase
        .from("profiles")
        .select("is_superuser, is_staff")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId),
    ]);

  const isAdminOrStaff = Boolean(
    profileRes.data?.is_superuser || profileRes.data?.is_staff,
  );
  const memberOrgIds = new Set(
    (memberRes.data ?? []).map((m) => m.organization_id),
  );

  const allOrgs = (orgsRes.data ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    acronym: o.acronym,
    isAffiliated:
      memberOrgIds.has(o.id) ||
      o.governor_id === userId ||
      o.adviser_id === userId,
  }));

  const affiliatedOrgs = allOrgs.filter((o) => o.isAffiliated);
  const organizations = (
    isAdminOrStaff || affiliatedOrgs.length === 0 ? allOrgs : affiliatedOrgs
  ).map(({ id, name, acronym }) => ({ id, name, acronym }));

  const semesters: ProposalSemesterOption[] = (semestersRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    startDate: s.start_date,
    endDate: s.end_date,
  }));

  const attachmentTypes: AttachmentType[] = (attachmentTypesRes.data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    code: a.code,
    category: a.category,
    description: a.description,
    isRequired: a.is_required,
    isActive: a.is_active,
    templateFileName: a.template_file_name,
    templateFilePath: a.template_file_path,
    templateFileUrl: a.template_file_url,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  }));

  return {
    organizations,
    venues: venuesRes.data ?? [],
    semesters,
    attachmentTypes,
  };
});
