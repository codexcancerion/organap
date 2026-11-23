// Server-side data queries for User Preferences & Institutional System Settings.
import type { AuthUser } from "@/types";
import type {
  InstitutionProfileSettings,
  ProposalPolicySettings,
  SemesterOption,
  SettingsPageData,
} from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";
import { parseUserPreferences } from "@/utils/user_preferences";

const DEFAULT_INSTITUTION_PROFILE: InstitutionProfileSettings = {
  institutionName: "OrGanap University",
  studentAffairsOffice: "Office of Student Affairs & Services",
  supportEmail: "osas@organap.edu",
};

const DEFAULT_PROPOSAL_POLICY: ProposalPolicySettings = {
  activeSemesterId: null,
  activeSemesterName: null,
  minLeadDays: 7,
  requireAdviserEndorsement: true,
  defaultVenueCapacity: 50,
};

function parseInstitutionProfile(raw: unknown): InstitutionProfileSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_INSTITUTION_PROFILE };
  }

  const record = raw as Record<string, unknown>;

  return {
    institutionName:
      typeof record.institutionName === "string" && record.institutionName.trim()
        ? record.institutionName.trim()
        : DEFAULT_INSTITUTION_PROFILE.institutionName,
    studentAffairsOffice:
      typeof record.studentAffairsOffice === "string" && record.studentAffairsOffice.trim()
        ? record.studentAffairsOffice.trim()
        : DEFAULT_INSTITUTION_PROFILE.studentAffairsOffice,
    supportEmail:
      typeof record.supportEmail === "string"
        ? record.supportEmail.trim()
        : DEFAULT_INSTITUTION_PROFILE.supportEmail,
  };
}

function parseProposalPolicy(raw: unknown): ProposalPolicySettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_PROPOSAL_POLICY };
  }

  const record = raw as Record<string, unknown>;
  const minLead = Number(record.minLeadDays);
  const defaultCap = Number(record.defaultVenueCapacity);

  return {
    activeSemesterId:
      typeof record.activeSemesterId === "string" && record.activeSemesterId.trim()
        ? record.activeSemesterId.trim()
        : null,
    activeSemesterName:
      typeof record.activeSemesterName === "string" && record.activeSemesterName.trim()
        ? record.activeSemesterName.trim()
        : null,
    minLeadDays:
      Number.isInteger(minLead) && minLead >= 0
        ? minLead
        : DEFAULT_PROPOSAL_POLICY.minLeadDays,
    requireAdviserEndorsement:
      typeof record.requireAdviserEndorsement === "boolean"
        ? record.requireAdviserEndorsement
        : DEFAULT_PROPOSAL_POLICY.requireAdviserEndorsement,
    defaultVenueCapacity:
      Number.isInteger(defaultCap) && defaultCap >= 1
        ? defaultCap
        : DEFAULT_PROPOSAL_POLICY.defaultVenueCapacity,
  };
}

/**
 * Fetch user notification/UI preferences, unread inbox count,
 * institutional system settings, and available semesters for `/settings`.
 */
export const getSettingsPageData = cache(async (
  user: AuthUser,
): Promise<SettingsPageData> => {
  const supabase = await createClient();
  const canManageSystemSettings =
    user.isSuperuser || user.permissions.includes("settings.manage");

  const [profileRes, unreadRes, systemSettingsRes, semestersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
    supabase
      .from("system_settings")
      .select("key, value, updated_at")
      .in("key", ["institution_profile", "proposal_policy"]),
    supabase
      .from("semesters")
      .select("id, name, start_date, end_date")
      .order("start_date", { ascending: false }),
  ]);

  const settingsRows = systemSettingsRes.data ?? [];
  const profileRow = settingsRows.find((r) => r.key === "institution_profile");
  const policyRow = settingsRows.find((r) => r.key === "proposal_policy");

  const semesters: SemesterOption[] = (semestersRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
  }));

  const policyUpdatedAt =
    [profileRow?.updated_at, policyRow?.updated_at]
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1) ?? null;

  return {
    preferences: parseUserPreferences(profileRes.data?.preferences),
    unreadCount: unreadRes.count ?? 0,
    institutionProfile: parseInstitutionProfile(profileRow?.value),
    proposalPolicy: parseProposalPolicy(policyRow?.value),
    policyUpdatedAt,
    semesters,
    canManageSystemSettings,
  };
});
