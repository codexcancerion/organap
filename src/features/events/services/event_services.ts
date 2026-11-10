// Browser-side event management mutations (FR-15).
import type { ServiceResult } from "@/types";

import { createClient } from "@/utils/supabase/client";

/**
 * Cancel an approved event with mandatory official reason (FR-15).
 * Releases the venue reservation and notifies all confirmed registrants.
 */
export async function cancelApprovedEvent(
  proposalId: string,
  reason: string
): Promise<ServiceResult<void>> {
  if (!reason?.trim()) {
    return { success: false, data: null, error: { message: "A cancellation reason is required." } };
  }

  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required" } };
  }

  const { error } = await supabase.rpc("cancel_approved_event", {
    p_proposal_id: proposalId,
    p_cancelled_by: userAuth.user.id,
    p_reason: reason.trim(),
  });

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, data: undefined, error: null };
}
