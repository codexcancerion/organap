# `src/features/settings/` — User Preferences & Institutional Settings

Manages personal interface preferences (`profiles.preferences`), theme appearance (`next-themes`), notification preferences, and institutional system parameters (`public.system_settings`).

## RBAC & Permissions

- **Personal Workspace (`Appearance`, `Notifications`)**: Available to every authenticated user (`profiles_update_self_or_admin`).
- **Institutional Policies (`public.system_settings`)**: Read-only view available to all authenticated users (`settings_select`); mutations are strictly governed by `settings.manage` (`isSuperuser || hasPermission("settings.manage")`) enforced via Postgres RLS (`settings_manage`).

## Architecture

- `types.ts` — Domain types for institutional branding, proposal policy defaults, semester options, and settings page hydration.
- `services/settings_queries.ts` — Cached server queries (`getSettingsPageData`).
- `services/settings_services.ts` — Validation and Supabase persistence (`saveUserPreferences`, `markAllNotificationsReadForUser`, `saveInstitutionSettings`).
- `components/` — Modular HeroUI v3 tab panels orchestrated by `SettingsWorkspace`.
