# Notifications Feature (`src/features/notifications`)

In-app notification inbox, unread counters, and automated lifecycle triggers for OrGanap (FR-11).

---

## 1. Domain Rationale & Automated Triggers

Notifications are dispatched automatically inside PostgreSQL (`SECURITY DEFINER` procedures and triggers) so alerts work reliably despite strict per-user `notifications` RLS (`user_id = auth.uid()`):

- **Submission & Resubmission (`trg_notify_proposal_workflow`)**: Alerts the organization's assigned `adviser_id` when a proposal enters `pending_adviser`.
- **Adviser Endorsement (`trg_notify_proposal_workflow`)**: Alerts active Student Affairs personnel and the submitting creator when a proposal advances to `pending_student_affairs`.
- **Return for Revision & Rejection (`trg_notify_proposal_workflow`)**: Alerts the submitting creator with `/events/<id>?view=review` deep links when adviser or Student Affairs returns or rejects a proposal.
- **Final Approval (`approve_event_proposal`)**: Notifies the submitting creator at `/events/<id>` once Student Affairs approves the event.
- **Student Registration (`register_for_event`)**: Confirms pass issuance with a direct link to `/registrations`.
- **Event Cancellation (`cancel_approved_event`)**: Fans out the cancellation reason to all `confirmed` and `attended` registrants and the submitting creator.

---

## 2. UI/UX Architecture & Technical Choices

1. **Derived Read State Architecture**:
   - Rather than duplicating prop arrays in `useState` + `useEffect`, `<NotificationList />` tracks optimistically marked items in `readIds: Set<string>` and derives display items in `useMemo`.
2. **HeroUI v3 Inbox Filtering**:
   - `<NotificationList />` uses HeroUI `SearchField`, `Tabs` (`All`, `Unread`), `Chip` status tags, and `EmptyState` for empty or caught-up views.
3. **Global Unread Counters**:
   - `getUnreadNotificationCount` feeds live unread badges in both the root `<Navbar />` bell link and the authenticated `<Sidebar />` `Notifications` item.
