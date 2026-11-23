// Browser-side mutations for User Preferences & Institutional System Settings.
import type { ServiceResult, UserPreferences } from "@/types";
import type {
  InstitutionProfileSettings,
  ProposalPolicySettings,
  SettingsValidationResult,
} from "../types";

import { createClient } from "@/utils/supabase/client";
import { mapSupabaseMutationError } from "@/utils/supabase/errors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInstitutionSettings(
  profile: InstitutionProfileSettings,
  policy: ProposalPolicySettings,
): SettingsValidationResult {
  if (profile.institutionName.trim().length < 2) {
    return {
      valid: false,
      message: "Institution name must be at least 2 characters.",
    };
  }

  if (profile.studentAffairsOffice.trim().length < 2) {
    return {
      valid: false,
      message: "Student Affairs office label must be at least 2 characters.",
    };
  }

  if (profile.supportEmail.trim() && !EMAIL_PATTERN.test(profile.supportEmail.trim())) {
    return {
      valid: false,
      message: "Please enter a valid support email address.",
    };
  }

  if (!Number.isInteger(policy.minLeadDays) || policy.minLeadDays < 0 || policy.minLeadDays > 365) {
    return {
      valid: false,
      message: "Minimum proposal lead days must be an integer between 0 and 365.",
    };
  }

  if (
    !Number.isInteger(policy.defaultVenueCapacity) ||
    policy.defaultVenueCapacity < 1 ||
    policy.defaultVenueCapacity > 50000
  ) {
    return {
      valid: false,
      message: "Default venue capacity must be a positive integer.",
    };
  }

  return { valid: true };
}

/**
 * Persist personal notification and UI preferences onto `public.profiles.preferences`.
 */
export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferences,
): Promise<ServiceResult<UserPreferences>> {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      preferences,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "your preferences",
        }),
      },
    };
  }

  return { success: true, data: preferences, error: null };
}

/**
 * Mark all unread notifications for the signed-in user as read.
 */
export async function markAllNotificationsReadForUser(
  userId: string,
): Promise<ServiceResult<void>> {
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "notifications",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Persist institutional branding and proposal policy settings (`settings.manage`).
 */
export async function saveInstitutionSettings(
  userId: string,
  profile: InstitutionProfileSettings,
  policy: ProposalPolicySettings,
): Promise<ServiceResult<void>> {
  const validation = validateInstitutionSettings(profile, policy);

  if (!validation.valid) {
    return {
      success: false,
      data: null,
      error: { message: validation.message },
    };
  }

  const supabase = createClient();
  const now = new Date().toISOString();

  const normalizedProfile: InstitutionProfileSettings = {
    institutionName: profile.institutionName.trim(),
    studentAffairsOffice: profile.studentAffairsOffice.trim(),
    supportEmail: profile.supportEmail.trim(),
  };

  const normalizedPolicy: ProposalPolicySettings = {
    activeSemesterId: policy.activeSemesterId || null,
    activeSemesterName: policy.activeSemesterName || null,
    minLeadDays: policy.minLeadDays,
    requireAdviserEndorsement: policy.requireAdviserEndorsement,
    defaultVenueCapacity: policy.defaultVenueCapacity,
  };

  const { error } = await supabase.from("system_settings").upsert(
    [
      {
        key: "institution_profile",
        value: normalizedProfile,
        description:
          "Institutional branding and official Student Affairs contact metadata displayed across portals.",
        updated_at: now,
        updated_by: userId,
      },
      {
        key: "proposal_policy",
        value: normalizedPolicy,
        description:
          "Campus event proposal lead-time rules, adviser endorsement requirement, active semester, and default venue parameters.",
        updated_at: now,
        updated_by: userId,
      },
    ],
    { onConflict: "key" },
  );

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "institutional settings",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}
