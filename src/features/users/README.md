# `src/features/users/` — Campus User Directory & Administration

Self-contained feature vertical for managing campus user accounts, staff/active statuses, and group memberships in OrGanap.

## Architecture

- `types.ts`: Local user administration types (`AdminUserListItem`, `UpdateUserProfileInput`, `UserFilterOptions`).
- `services/user_queries.ts`: Server Component loaders (`getAdminUsers`).
- `services/user_services.ts`: Client mutation calls (`updateUserProfile`, `assignUserToGroup`, `removeUserFromGroup`, `toggleUserActive`, `toggleUserStaff`).
- `components/user_table.tsx`: User directory table with search across name and school ID, group filtering, status chips, and action modals.
- `components/user_edit_modal.tsx`: Modal for modifying profile metadata, active state, staff status, and superuser status (safeguarded).
- `components/user_group_modal.tsx`: Modal for checking/unchecking dynamic group memberships.

## Hermeticity Rules

1. Zero imports from `src/features/groups/` or any other sibling feature.
2. Shared domain types (`UserGroup`, `UserProfile`, `AuthUser`) are sourced from `@/types`.
3. Mutations to `user_groups` are strictly encapsulated in `services/user_services.ts`.
