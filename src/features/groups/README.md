# `src/features/groups/` — Dynamic Groups & Permissions Management

Self-contained feature vertical for managing Django-style groups and granular permissions in OrGanap.

## Architecture

- `types.ts`: Local group types (`AdminGroupListItem`, `CreateGroupInput`, `UpdateGroupInput`, `PermissionModuleGroup`, `PROTECTED_SYSTEM_GROUPS`).
- `services/group_queries.ts`: Server Component loaders (`getAdminGroups`, `getAllPermissions`).
- `services/group_services.ts`: Client mutation calls (`createGroup`, `updateGroup`, `deleteGroup`, `toggleGroupPermission`, `updateGroupPermissionsBatch`).
- `components/group_list.tsx`: Group directory, search, stats cards, and action dispatchers.
- `components/group_modal.tsx`: Modal for group creation and metadata updates with system group naming protection.
- `components/group_permission_matrix.tsx`: Interactive Accordion/Checkbox matrix grouping permissions by module.

## Hermeticity Rules

1. Zero imports from `src/features/users/` or any other sibling feature.
2. Shared domain types (`UserGroup`, `Permission`) are sourced from `@/types`.
3. Client mutations are strictly encapsulated in `services/group_services.ts`.
