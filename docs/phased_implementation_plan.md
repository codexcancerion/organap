# Phased Implementation Plan

**OrGanap v0.1.0** | Engineering Roadmap

---

## Phase 1: Project Initialization, Stack & Auth (Current)
- [x] Project scaffolding mirroring `voxsels` tech stack (Next.js 16, HeroUI v3, Tailwind v4, TypeScript, Supabase SSR).
- [x] Canonical documentation setup: SRS transcript, Technical Specifications, Architecture, Database Design, Rationale.
- [x] Supabase Auth & Profile schema migration (`user_role` enum, `profiles`, `organizations`, `organization_members`, triggers).
- [x] Auth feature implementation: Sign In, Sign Up with School ID & Role, Forgot Password, Profile Hydration, and Session Proxy.
- [x] Persistent navigation chrome: Navbar, Collapsible Sidebar, and Desktop AuthShell.
- [x] Role-tailored empty dashboard shell.
- [x] Quality gates: linting, typechecking, rule compliance check, and unit test suite.

---

## Phase 2: Organizations & Venues Management
- [ ] Student Affairs administration for recognized organizations (CRUD, categories, logos).
- [ ] Officer and faculty adviser assignments to organizations.
- [ ] Institutional venue inventory management (locations, capacity, availability).
- [ ] Public organization directory for student exploration.

---

## Phase 3: Event Proposals & Two-Stage Approval Routing
- [ ] Officer proposal drafting interface with draft autosave (FR-03).
- [ ] Comprehensive validation rules (dates, capacity, registration deadline) (FR-04).
- [ ] Faculty adviser review portal: endorse, return with remarks, reject (FR-05).
- [ ] Student Affairs review portal with automated venue conflict detection engine (FR-06, FR-07).
- [ ] Revision and resubmission workflow maintaining full chronological review history (FR-08, FR-09).

---

## Phase 4: Student Event Browsing & Registration
- [ ] Public event showcase & interactive calendar view (FR-10, FR-16).
- [ ] Student registration with capacity countdown and deadline guardrails (FR-12).
- [ ] Registration withdrawal and quota replenishment (FR-12).
- [ ] Personal ticket view and event cancellation notifications (FR-11, FR-15).

---

## Phase 5: Attendance Verification & Reporting
- [ ] Officer check-in console active during the scheduled event window (FR-13).
- [ ] Manual check-in via student ID verification (FR-13).
- [ ] Event-specific QR code check-in scanner (FR-17).
- [ ] Attendance reporting and CSV export distinguishing registered vs confirmed attendees (FR-14).
- [ ] Role-scoped dashboard summary analytics and participation counters (FR-18).
