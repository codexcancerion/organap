// Browser-side mutation services for Event Registration & Passes (FR-12, FR-17).
import type { ServiceResult } from "@/types";

import { createClient } from "@/utils/supabase/client";

/**
 * Register the authenticated student for an approved event with atomic capacity check (FR-12).
 */
export async function registerForEvent(
  eventId: string
): Promise<ServiceResult<{ registrationId: string; qrToken: string }>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required to register for events." } };
  }

  const { data, error } = await supabase.rpc("register_for_event", {
    p_proposal_id: eventId,
    p_student_id: userAuth.user.id,
  });

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  const res = data as {
    registration_id: string;
    qr_token: string;
  };

  return {
    success: true,
    data: {
      registrationId: res.registration_id,
      qrToken: res.qr_token,
    },
    error: null,
  };
}

/**
 * Withdraw student from an active registration before deadline (FR-12).
 * Releases the reserved spot immediately.
 */
export async function withdrawFromEvent(
  registrationId: string
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required." } };
  }

  const { error } = await supabase.rpc("withdraw_from_event", {
    p_registration_id: registrationId,
    p_student_id: userAuth.user.id,
  });

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, data: undefined, error: null };
}
