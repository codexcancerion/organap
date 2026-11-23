# Attachments Feature (`src/features/attachments`)

Dynamic configuration of event proposal attachment requirement types in `public.attachment_types` governed by granular RBAC permissions: `attachments.view`, `attachments.create`, `attachments.change`, and `attachments.delete`.

---

## 1. Domain Rationale & Business Rules

1. **Pre-Activity Scope & Accomplishment Report Exclusion**:
   - The seeded catalog standardizes on the 13 pre-activity requirements from `soams-kcp`: `ACTIVITY_PROPOSAL_FORM`, `LETTER_OF_INTENT`, `ACTIVITY_DESIGN`, `BUDGET_PROPOSAL`, `PROGRAM_PAPER`, `ACTIVITY_POSTER`, `VENUE_RESERVATION_FORM`, `MINUTES_OF_MEETING`, `PURCHASE_REQUEST`, `RESOLUTION`, `PARENT_CONSENT`, `WAIVER_FORM`, and `MEDICAL_CLEARANCE`.
   - Why exclude `Accomplishment Report` from pre-activity types? Post-event accomplishment reporting occurs after execution during event evaluation rather than during pre-approval vetting. Keeping post-activity filings out of `attachment_types` prevents proposal submission from gating an event on proof that cannot exist before the event runs.
2. **Dynamic Institutional Catalog & Submission Enforcement**:
   - Authorized OSAS personnel can create, edit, deactivate, or retire requirement types from `/attachments` without code changes. When active types have `is_required = true`, `<ProposalForm />` displays dedicated upload slots and blocks submission until each required slot has an uploaded file.
3. **Optional Category Grouping with `Others` Fallback**:
   - `attachment_types.category` accepts an optional institutional group label such as `Documents`, `For Student Organizations`, `Activities with Outside Participants`, or `General`, and automatically falls back to `Others` when left blank.
   - Why store categories dynamically in the database rather than hardcoding slot sections in React? Hardcoding category buckets would break as soon as administrators introduce a new document category or rename a checklist section in `soams-kcp`. Database-backed grouping with an `Others` fallback keeps both `/attachments` and `<ProposalForm />` synchronized and scannable across large requirement packets.
4. **Optional Reference Templates**:
   - Each requirement type can optionally publish a downloadable blank template via `template_file_name`, `template_file_path`, and `template_file_url` stored in `organap-assets/events/templates/`.
   - Why keep templates optional per requirement? Institutional forms like Letters of Intent and Purchase Requests follow standardized formatting, whereas creative artifacts such as `Activity Poster` and external `Medical Clearance` documents cannot conform to a single blank template.
5. **Preserved Historical Files**:
   - `public.event_attachments` references `attachment_types(id)` with `ON DELETE SET NULL`. Retiring a requirement removes it from new proposal drafts without erasing uploaded files linked to past events.

---

## 2. UI/UX Architecture & Technical Choices

- **Category-Grouped Packet Rendering**: `<ProposalForm />` and `/attachments` group active requirements under collapsible or structured section headers with per-category slot count chips so officers never face an undifferentiated wall of 13 upload inputs.
- **Unified Card & Modal Standards**: Uses `<PageHeader />`, HeroUI `<SearchField />`, HeroUI `<Tabs variant="secondary" />`, and HeroUI v3 `<Card />` containers following `docs/card_standard.md`, with destructive retirement isolated inside `<AttachmentTypeModal />` and `<ConfirmDeleteModal />`.
- **Feature Hermeticity**: Shared storage upload and template helpers live in `src/utils/supabase/event_attachments.ts` so `src/features/attachments` and `src/features/proposals` never import across feature boundaries.
