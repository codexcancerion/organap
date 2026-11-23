import type { UserPreferences } from "@/types";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  proposalAlerts: true,
  eventReminders: true,
  emailNotifications: true,
  compactSidebarDefault: false,
};

/**
 * Normalizes loosely typed JSONB user preferences from `profiles.preferences`
 * into a complete `UserPreferences` record with safe defaults.
 */
export function parseUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  const record = raw as Record<string, unknown>;

  return {
    proposalAlerts:
      typeof record.proposalAlerts === "boolean"
        ? record.proposalAlerts
        : DEFAULT_USER_PREFERENCES.proposalAlerts,
    eventReminders:
      typeof record.eventReminders === "boolean"
        ? record.eventReminders
        : DEFAULT_USER_PREFERENCES.eventReminders,
    emailNotifications:
      typeof record.emailNotifications === "boolean"
        ? record.emailNotifications
        : DEFAULT_USER_PREFERENCES.emailNotifications,
    compactSidebarDefault:
      typeof record.compactSidebarDefault === "boolean"
        ? record.compactSidebarDefault
        : DEFAULT_USER_PREFERENCES.compactSidebarDefault,
  };
}
