// Browser-side review mutation services for Adviser & Student Affairs workflows (FR-05, FR-06, FR-07).
import type { ServiceResult } from "@/types";

import { createClient } from "@/utils/supabase/client";

/**
 * Check if a venue is already booked for an overlapping approved event (FR-07).
 * INVARIANT: Checks the universal interval intersection theorem (startA < endB AND endA > startB) to detect
 * partial overlaps, exact matches, and full encapsulations without false negatives.
 */
export async function checkVenueConflict(
  venueId: string,
  startTime: string,
  endTime: string,
  excludeProposalId?: string
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("check_venue_conflict", {
    p_venue_id: venueId,
    p_start_time: startTime,
    p_end_time: endTime,
    p_exclude_proposal_id: excludeProposalId || undefined,
  });

  if (error) {
    console.error("Venue conflict check failed:", error.message);

    return false;
  }

  return !!data;
}

/**
 * Faculty Adviser Endorsement (FR-05).
 * Transitions status to 'pending_student_affairs'.
 */
export async function endorseProposal(
  proposalId: string,
  remarks?: string
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required" } };
  }

  // 1. Update proposal status
  const { error: updateErr } = await supabase
    .from("event_proposals")
    .update({
      status: "pending_student_affairs",
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId)
    .eq("status", "pending_adviser");

  if (updateErr) {
    return { success: false, data: null, error: { message: updateErr.message } };
  }

  // 2. Insert audit review record
  await supabase.from("proposal_reviews").insert({
    proposal_id: proposalId,
    reviewer_id: userAuth.user.id,
    stage: "adviser",
    decision: "endorsed",
    remarks: remarks?.trim() || null,
  });

  return { success: true, data: undefined, error: null };
}

/**
 * Return proposal for revision (FR-05, FR-06, FR-08).
 * Requires remarks explaining the necessary changes.
 */
export async function returnProposal(
  proposalId: string,
  remarks: string,
  stage: "adviser" | "student_affairs"
): Promise<ServiceResult<void>> {
  if (!remarks?.trim()) {
    return { success: false, data: null, error: { message: "Remarks are required when returning a proposal for revision." } };
  }

  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required" } };
  }

  const nextStatus = stage === "adviser" ? "returned_by_adviser" : "returned_by_student_affairs";

  const { error: updateErr } = await supabase
    .from("event_proposals")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  if (updateErr) {
    return { success: false, data: null, error: { message: updateErr.message } };
  }

  await supabase.from("proposal_reviews").insert({
    proposal_id: proposalId,
    reviewer_id: userAuth.user.id,
    stage,
    decision: "returned_for_revision",
    remarks: remarks.trim(),
  });

  return { success: true, data: undefined, error: null };
}

/**
 * Reject proposal (FR-05, FR-06).
 * Requires remarks explaining the justification.
 */
export async function rejectProposal(
  proposalId: string,
  remarks: string,
  stage: "adviser" | "student_affairs"
): Promise<ServiceResult<void>> {
  if (!remarks?.trim()) {
    return { success: false, data: null, error: { message: "Remarks are required when rejecting a proposal." } };
  }

  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required" } };
  }

  const nextStatus = stage === "adviser" ? "rejected_by_adviser" : "rejected_by_student_affairs";

  const { error: updateErr } = await supabase
    .from("event_proposals")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  if (updateErr) {
    return { success: false, data: null, error: { message: updateErr.message } };
  }

  await supabase.from("proposal_reviews").insert({
    proposal_id: proposalId,
    reviewer_id: userAuth.user.id,
    stage,
    decision: "rejected",
    remarks: remarks.trim(),
  });

  return { success: true, data: undefined, error: null };
}

/**
 * Student Affairs Final Approval with Venue Row Lock (FR-06, FR-07).
 */
export async function approveProposal(
  proposalId: string,
  remarks?: string
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required" } };
  }

  const { error } = await supabase.rpc("approve_event_proposal", {
    p_proposal_id: proposalId,
    p_reviewer_id: userAuth.user.id,
    p_remarks: remarks?.trim() || undefined,
  });

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, data: undefined, error: null };
}
