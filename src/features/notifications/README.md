# Notifications Feature (`src/features/notifications`)

In-app notification system (FR-11). Delivers real-time and persistent alerts to students, officers, faculty advisers, and student affairs administrators.

## Structure
- `types.ts` — Type definitions for notification items and status.
- `services/notification_queries.ts` — Server queries for user notifications.
- `services/notification_services.ts` — Mutation services (mark as read, clear).
- `components/` — HeroUI-first notification bell dropdown and full notification history list.
