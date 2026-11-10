# `src/features/dashboard/` — Role-Aware Dashboard

This feature renders tailored home dashboards for authenticated users:
- `student`: My registrations, attendance count, upcoming events.
- `officer`: Proposal drafts, review status, check-in console launcher.
- `adviser`: Proposals pending endorsement, historical endorsements.
- `student_affairs` / `superadmin`: Final approval queue, venue status, university metrics.

## Components
- `empty_dashboard.tsx`: Initial zero-data state with metric cards and contextual quick actions.
