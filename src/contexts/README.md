# `src/contexts/` — Global React Contexts

This folder holds application-wide React contexts.

## Providers

- `auth_context.tsx`: `AuthContext` and `useAuth()` hook for accessing current session user, Django-style permission/group evaluation (`hasPermission`, `inGroup`), and authentication actions.
- `right_panel_context.tsx`: `RightPanelContext`, `useRightPanel()`, `useRightPanelLayout()`, and `useSetRightPanel()` for managing 3-pane right panel resizing, presets, collapse states, and dynamic route-driven render slots.
