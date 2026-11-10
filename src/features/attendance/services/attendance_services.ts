// Browser-side mutation services for Event Attendance Verification (FR-13, FR-17).
import type { ServiceResult } from "@/types";

import { createClient } from "@/utils/supabase/client";

/**
 * Record attendance check-in for a registered student via token or School ID (FR-13, FR-17).
 */
export async function recordCheckIn(
  eventId: string,
  tokenOrStudentId: string,
  method: "manual" | "qr_scanner" = "manual"
): Promise<ServiceResult<{ studentName: string; schoolId: string; checkInAt: string }>> {
  if (!tokenOrStudentId?.trim()) {
    return { success: false, data: null, error: { message: "Passcode or Student ID is required." } };
  }

  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required." } };
  }

  const { data, error } = await supabase.rpc("record_attendance_entry", {
    p_proposal_id: eventId,
    p_token_or_student_id: tokenOrStudentId.trim(),
    p_verified_by: userAuth.user.id,
    p_method: method,
  });

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  const res = data as {
    student_name: string;
    school_id: string;
    check_in_at: string;
  };

  return {
    success: true,
    data: {
      studentName: res.student_name,
      schoolId: res.school_id,
      checkInAt: res.check_in_at,
    },
    error: null,
  };
}
