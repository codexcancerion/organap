import type { UserPreferences } from "@/types";

export type InstitutionProfileSettings = {
  institutionName: string;
  studentAffairsOffice: string;
  supportEmail: string;
};

export type ProposalPolicySettings = {
  activeSemesterId: string | null;
  activeSemesterName: string | null;
  minLeadDays: number;
  requireAdviserEndorsement: boolean;
  defaultVenueCapacity: number;
};

export type SemesterOption = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export type SettingsPageData = {
  preferences: UserPreferences;
  unreadCount: number;
  institutionProfile: InstitutionProfileSettings;
  proposalPolicy: ProposalPolicySettings;
  policyUpdatedAt: string | null;
  semesters: SemesterOption[];
  canManageSystemSettings: boolean;
};

export type SettingsValidationResult =
  | { valid: true }
  | { valid: false; message: string };
