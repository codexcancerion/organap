// Browser-side mutation services for Event Proposals (FR-03, FR-04, FR-08).
import type { EventAttachment, ServiceResult } from "@/types";
import type { ProposalFormData } from "../types";

import { createClient } from "@/utils/supabase/client";
import {
  deleteEventAttachmentFile,
  uploadEventAttachmentFile,
} from "@/utils/supabase/event_attachments";

/**
 * Validate proposal form business rules (FR-04):
 * - Title, activity type, and rationale must not be empty.
 * - Capacity must be positive.
 * - Start time must precede end time.
 * - Registration deadline must not exceed start time.
 */
export function validateProposalForm(data: ProposalFormData): { isValid: boolean; error?: string } {
  if (!data.title?.trim()) {
    return { isValid: false, error: "Event title is required." };
  }
  if (!data.organizationId) {
    return { isValid: false, error: "Please select an organizing student group." };
  }
  if (!data.activityType?.trim()) {
    return { isValid: false, error: "Please select an activity type." };
  }
  if (!data.venueId) {
    return { isValid: false, error: "Please select a target campus venue." };
  }
  if (!data.purpose?.trim()) {
    return { isValid: false, error: "Event rationale is required." };
  }
  if (!data.capacity || data.capacity <= 0) {
    return { isValid: false, error: "Participant capacity must be greater than zero." };
  }
  if (!data.startTime || !data.endTime) {
    return { isValid: false, error: "Event start and end schedules are required." };
  }

  const start = new Date(data.startTime).getTime();
  const end = new Date(data.endTime).getTime();

  if (isNaN(start) || isNaN(end) || end <= start) {
    return { isValid: false, error: "Event end time must follow the start time." };
  }

  if (!data.registrationDeadline) {
    return { isValid: false, error: "Registration deadline is required." };
  }

  const deadline = new Date(data.registrationDeadline).getTime();

  if (isNaN(deadline) || deadline > start) {
    return { isValid: false, error: "Registration deadline cannot be after the event start time." };
  }

  return { isValid: true };
}

async function verifyRequiredAttachmentsPresent(
  supabase: ReturnType<typeof createClient>,
  proposalId: string,
): Promise<string | null> {
  const [{ data: requiredTypes }, { data: uploadedAttachments }] = await Promise.all([
    supabase
      .from("attachment_types")
      .select("id, name")
      .eq("is_active", true)
      .eq("is_required", true),
    supabase
      .from("event_attachments")
      .select("id, attachment_type_id")
      .eq("proposal_id", proposalId),
  ]);

  if (!requiredTypes || requiredTypes.length === 0) {
    return null;
  }

  const uploadedTypeIds = new Set(
    (uploadedAttachments ?? [])
      .map((a) => a.attachment_type_id)
      .filter((id): id is string => Boolean(id)),
  );

  const missing = requiredTypes.filter((t) => !uploadedTypeIds.has(t.id));

  if (missing.length > 0) {
    return `Missing required attachment${missing.length === 1 ? "" : "s"}: ${missing.map((m) => m.name).join(", ")}.`;
  }

  return null;
}

/**
 * Save proposal as draft (FR-03).
 */
export async function saveDraft(
  data: ProposalFormData,
  proposalId?: string,
  preserveStatus?: string,
): Promise<ServiceResult<string>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required" } };
  }

  const keepReturnedStatus =
    Boolean(proposalId) &&
    (preserveStatus === "returned_by_adviser" ||
      preserveStatus === "returned_by_student_affairs");

  const payload = {
    title: data.title.trim() || "Untitled Proposal",
    organization_id: data.organizationId,
    purpose: data.purpose.trim() || "No rationale specified yet",
    activities_desc: data.activitiesDesc?.trim() ?? "",
    activity_type: data.activityType?.trim() || "seminar",
    semester_id: data.semesterId || null,
    venue_id: data.venueId,
    start_time: data.startTime,
    end_time: data.endTime,
    registration_deadline: data.registrationDeadline,
    capacity: data.capacity || 50,
    status: keepReturnedStatus ? preserveStatus : "draft",
    updated_at: new Date().toISOString(),
  };

  if (proposalId) {
    const { error } = await supabase
      .from("event_proposals")
      .update(payload)
      .eq("id", proposalId);

    if (error) {
      return { success: false, data: null, error: { message: error.message } };
    }

    return { success: true, data: proposalId, error: null };
  }

  const { data: inserted, error } = await supabase
    .from("event_proposals")
    .insert({
      ...payload,
      created_by: userAuth.user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { success: false, data: null, error: { message: error?.message ?? "Failed to create draft" } };
  }

  return { success: true, data: inserted.id, error: null };
}

/**
 * Upload an attachment for an event proposal.
 */
export async function uploadProposalAttachment(params: {
  proposalId: string;
  attachmentTypeId: string | null;
  attachmentTypeName?: string | null;
  attachmentTypeCode?: string | null;
  attachmentTypeCategory?: string | null;
  file: File;
}): Promise<ServiceResult<EventAttachment>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required" } };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, display_name")
    .eq("id", userAuth.user.id)
    .maybeSingle();

  const uploadedByName =
    profile?.full_name || profile?.display_name || userAuth.user.email || null;

  return uploadEventAttachmentFile(supabase, {
    ...params,
    uploadedBy: userAuth.user.id,
    uploadedByName,
  });
}

/**
 * Delete an uploaded attachment from an event proposal.
 */
export async function removeProposalAttachment(
  attachmentId: string,
  filePath: string,
): Promise<ServiceResult<void>> {
  const supabase = createClient();

  return deleteEventAttachmentFile(supabase, attachmentId, filePath);
}

/**
 * Submit proposal for faculty endorsement (FR-04).
 * Transitions status from 'draft' to 'pending_adviser'.
 */
export async function submitProposal(proposalId: string): Promise<ServiceResult<void>> {
  const supabase = createClient();

  const { data: prop, error: fetchErr } = await supabase
    .from("event_proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (fetchErr || !prop) {
    return { success: false, data: null, error: { message: "Proposal not found" } };
  }

  // Pre-submission validation
  const validation = validateProposalForm({
    title: prop.title,
    organizationId: prop.organization_id,
    venueId: prop.venue_id,
    purpose: prop.purpose,
    activitiesDesc: prop.activities_desc ?? "",
    activityType: prop.activity_type || "seminar",
    semesterId: prop.semester_id ?? null,
    capacity: prop.capacity,
    startTime: prop.start_time,
    endTime: prop.end_time,
    registrationDeadline: prop.registration_deadline,
  });

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error ?? "Invalid proposal data" } };
  }

  const missingAttachmentError = await verifyRequiredAttachmentsPresent(supabase, proposalId);

  if (missingAttachmentError) {
    return { success: false, data: null, error: { message: missingAttachmentError } };
  }

  const { error } = await supabase
    .from("event_proposals")
    .update({
      status: "pending_adviser",
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Resubmit a proposal that was returned for revision (FR-08).
 * Restarts adviser review while retaining complete decision history.
 */
export async function resubmitProposal(
  proposalId: string,
  data: ProposalFormData
): Promise<ServiceResult<void>> {
  const validation = validateProposalForm(data);

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error ?? "Invalid revision data" } };
  }

  const supabase = createClient();

  const missingAttachmentError = await verifyRequiredAttachmentsPresent(supabase, proposalId);

  if (missingAttachmentError) {
    return { success: false, data: null, error: { message: missingAttachmentError } };
  }

  const { error } = await supabase
    .from("event_proposals")
    .update({
      title: data.title.trim(),
      organization_id: data.organizationId,
      venue_id: data.venueId,
      purpose: data.purpose.trim(),
      activities_desc: data.activitiesDesc?.trim() ?? "",
      activity_type: data.activityType?.trim() || "seminar",
      semester_id: data.semesterId || null,
      capacity: data.capacity,
      start_time: data.startTime,
      end_time: data.endTime,
      registration_deadline: data.registrationDeadline,
      status: "pending_adviser",
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Delete draft proposal and clean up its uploaded storage objects.
 */
export async function deleteDraft(proposalId: string): Promise<ServiceResult<void>> {
  const supabase = createClient();

  const { data: attachments } = await supabase
    .from("event_attachments")
    .select("file_path")
    .eq("proposal_id", proposalId);

  const { error } = await supabase
    .from("event_proposals")
    .delete()
    .eq("id", proposalId);

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  const paths = (attachments ?? [])
    .map((a) => a.file_path)
    .filter((p): p is string => Boolean(p));

  if (paths.length > 0) {
    await supabase.storage.from("organap-assets").remove(paths);
  }

  return { success: true, data: undefined, error: null };
}
