# Notifications Feature (`src/features/notifications`)

In-app notification system delivering persistent alerts to students, officers, faculty advisers, and student affairs administrators (FR-11).

---

## 1. Domain Rationale & Automated Triggers

Notifications are automatically dispatched by database stored procedures during critical lifecycle milestones:
- **Proposal Submission**: Alerts assigned faculty advisers of a pending endorsement queue.
- **Review Decision**: Alerts the submitting officer when a proposal is endorsed, returned for revisions, approved, or rejected.
- **Event Cancellation (FR-15)**: Fans out high-priority notices with cancellation reasons to all students registered for the affected event.
- **Registration Confirmation (FR-12)**: Confirms participant entry pass readiness.

---

## 2. UI/UX Architecture & Technical Choices

1. **Derived Read State Architecture**:
   - Rather than storing duplicated items state and synchronizing in a `useEffect` (which triggers React compiler cascade warnings), `<NotificationList />` tracks newly read item IDs in a local `readIds: Set<string>` state.
   - The display list is derived via `useMemo`, ensuring immediate optimistic UI responsiveness while keeping React rendering pure.
2. **Global Navigation Bell**:
   - Integrated into the persistent navigation chrome (`Navbar` and `Sidebar`), providing an immediate visual entry point to the notifications history (`/notifications`).
3. **Cardless PageHeader Standard**:
   - The `/notifications` route uses the standardized `<PageHeader />` layout component with a single-click "Mark all as read" action.
