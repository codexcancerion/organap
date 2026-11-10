# OrGanap

> **A Student Organization Event Approval and Attendance Management System.**
> Centralizing event proposals, two-stage adviser & Student Affairs approvals,
> venue conflict prevention, student event registrations, and digital attendance verification.

| Version | Date | Description |
| :--- | :--- | :--- |
| 0.1.0-dev | 2026-11-10 | Initial release: Next.js 16 + HeroUI v3 + Supabase Auth & Role Dashboard. |

Read [`docs/requirements_specification.md`](docs/requirements_specification.md) for the functional & non-functional requirements (FR-01 to FR-18, NFR-01 to NFR-08), [`docs/rationale.md`](docs/rationale.md) for the project rationale, and [`docs/technical_specifications.md`](docs/technical_specifications.md) for the system architecture. The execution roadmap lives in [`docs/phased_implementation_plan.md`](docs/phased_implementation_plan.md).

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, React 19) |
| UI Library | [HeroUI v3](https://heroui.com) (`@heroui/react` + `@heroui/styles`) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [`tailwind-variants`](https://tailwind-variants.org) |
| Language | TypeScript (`strict: true`) |
| Backend | [Supabase](https://supabase.com) (Postgres, Auth, Realtime, RLS) via `@supabase/ssr` |
| Theming | [`next-themes`](https://github.com/pacocoursey/next-themes) (dark default) |
| Icons | [Lucide React](https://lucide.dev) |
| Testing | [Vitest](https://vitest.dev) + `@testing-library/react` |

> Full development rules & invariants: [`AGENTS.md`](AGENTS.md).

---

## System Overview & Roles

OrGanap establishes an institution-wide workflow for recognized student organizations:

1. **Student Organization Officers**: Draft event proposals, address review remarks, manage registrations, verify student attendance during scheduled event hours, and export CSV attendance reports.
2. **Faculty Advisers**: Review proposals from assigned organizations; endorse proposals to Student Affairs, or return/reject them with required feedback.
3. **Student Affairs Personnel**: Grant final approval after automated venue conflict checking, cancel approved events with justification, manage organization listings, and review institutional reports.
4. **Student Attendees**: Browse approved public events, register within deadlines and venue capacity limits, obtain digital tickets/QR codes, and cancel registrations if needed.
5. **Superadmins / IT Administrators**: System configuration, account role assignments, and platform audit logs.

---

## Folder Layout

```
src/
  app/                       ← Next.js App Router routes (compose only, no direct logic)
  components/                ← Shared UI components (≥ 2 callers)
    layout/ navigation/ ui/
  features/                  ← Self-contained product verticals
    auth/                    ← User authentication & profile management
    dashboard/               ← Role-tailored dashboard shells
    organizations/           ← Recognized student organizations
    proposals/               ← Two-stage approval workflow & conflict checks
    events/                  ← Event calendar & student exploration
    registrations/           ← Event registration & ticket issuing
    attendance/              ← Attendance check-in & verification
    reports/                 ← Participation metrics & CSV export
  contexts/                  ← App-wide React contexts (AuthContext, etc.)
  hooks/                     ← Cross-feature custom hooks
  utils/                     ← Pure utilities and Supabase clients (client, server, middleware)
  config/                    ← Static site metadata & font definitions
  types/                     ← Cross-feature TypeScript types (database.ts, domain.ts)
  styles/globals.css         ← Tailwind v4 & HeroUI styles (only CSS file in the project)
  proxy.ts                   ← Next.js 16 session proxy
docs/                        ← Full specifications, database designs, architecture
supabase/                    ← Migrations, config, and seed data
```

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

### 3. Local Supabase (Optional)

```bash
npm run db:start
npm run db:types
```

### 4. Run the Dev Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start development server on port 3000. |
| `npm run build` | Next.js production build. |
| `npm run start` | Run production server. |
| `npm run lint` | ESLint (Flat config) with autofix. |
| `npm run typecheck` | Run `tsc --noEmit`. |
| `npm run test` | Run Vitest unit tests. |
| `npm run rules:check` | Run OrGanap static rule and anti-pattern checker. |
| `npm run ship` | Execute full release and deployment pipeline. |
