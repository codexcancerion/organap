<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# OrGanap — Project Agent Rules

You are working inside the **OrGanap** codebase. OrGanap is a unified web-based
information system for managing student organization event proposals, two-stage
adviser & Student Affairs approval workflows, venue conflict prevention, student
registrations, and digital attendance verification (FR-01 to FR-18).
Read `docs/requirements_specification.md`, `docs/rationale.md`, and
`docs/technical_specifications.md` before changing anything non-trivial.

---

## Tech stack (locked)

| Layer | Tool |
| --- | --- |
| Framework | Next.js 16 (App Router, `src/app/`) |
| UI library | **HeroUI v3** (`@heroui/react` + `@heroui/styles`) — v3 only |
| Styling | Tailwind CSS v4 + `tailwind-variants`. No raw CSS files. |
| Language | TypeScript (strict) |
| Backend | Supabase (Postgres, Auth, Realtime) via `@supabase/ssr` |
| Icons | Lucide React (preferred) or inline SVG |
| Theming | `next-themes` (class strategy, dark default) |

Never introduce an alternative UI library, alternative styling system, or
alternative backend. If a new dependency is required, justify it and update
`docs/technical_specifications.md`.

---

## Folder layout (canonical)

> One source of truth lives at `docs/technical_specifications.md`. Every folder below has a local `README.md` that enforces these rules.

```
src/
  app/                       ← Next.js App Router routes (pages, layouts, route handlers, error/loading UI)
  components/
    layout/                  ← Page-level shells (header, page, section)
    navigation/              ← Persistent chrome (navbar, sidebar, auth_shell, footer)
    ui/                      ← Global primitives (logo, theme switch, shared modals)
  features/
    auth/                    ← Authentication (login, register, reset password, profiles)
    dashboard/               ← Role-aware dashboards (student, officer, adviser, student_affairs, superadmin)
    organizations/           ← Student organizations management & roster
    proposals/               ← Event proposals & two-stage approval routing
    events/                  ← Approved events calendar & student browsing
    registrations/           ← Student registration & withdrawal
    attendance/              ← Event attendance verification & QR check-in
    reports/                 ← Participation & attendance reports with CSV export
  contexts/                  ← React contexts (AuthContext, Providers, etc.)
  hooks/                     ← Cross-feature hooks (NOT feature-scoped)
  utils/                     ← Pure helpers, formatters, validators
  config/                    ← Static config (site metadata, fonts)
  types/                     ← Global/shared TS types (domain.ts, database.ts)
  styles/globals.css         ← Tailwind + HeroUI imports + @theme tokens only
proxy.ts                     ← Next.js 16 proxy (refreshes session per request)
docs/                        ← Markdown documentation (specs, architecture, database, rationale, plans)
public/                      ← Static assets
supabase/                    ← Local Supabase (migrations, config.toml, seed)
```

### Where does a new file go?

| If it is… | Put it in… |
| --- | --- |
| A route (`page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`) | `src/app/<route>/` |
| A page section (hero, CTA block, stats card) | `src/components/layout/<purpose>.tsx` |
| A navbar / sidebar / footer chrome piece | `src/components/navigation/<purpose>.tsx` |
| A reusable primitive (icon, logo, theme switch) used by **≥ 2 features** | `src/components/ui/<purpose>.tsx` |
| Anything tied to event proposals or approvals | `src/features/proposals/components/<purpose>.tsx` |
| Anything tied to student event registration | `src/features/registrations/components/<purpose>.tsx` |
| Anything tied to attendance / check-in | `src/features/attendance/components/<purpose>.tsx` |
| Hook used by one feature only | `src/features/<feature>/hooks/<purpose>.ts(x)` |
| Hook used by ≥ 2 features | `src/hooks/<purpose>.ts(x)` |
| Type used by one feature only | `src/features/<feature>/types.ts` |
| Type used by ≥ 2 features | `src/types/<purpose>.ts` |
| Supabase CRUD for one feature | `src/features/<feature>/services/<purpose>.ts(x)` |

If you are unsure, **default to the more specific folder**. Promotion to a
shared location requires ≥ 2 callers.

---

## HeroUI v3 only — never v2

This project ships **HeroUI v3**. Do **not** apply v2 patterns:

- ❌ No `<HeroUIProvider>` (v3 has no provider).
- ❌ No `framer-motion` (v3 animations are CSS-driven).
- ❌ No `title="…"` props on `<Card>` — v3 uses compound components (`<Card.Header>`, `<Card.Title>`, `<Card.Content>`).
- ❌ No `@heroui/system` or `@heroui/theme` — only `@heroui/react` + `@heroui/styles`.

Always query the docs before introducing a component:

- Skill: `.agents/skills/heroui-react/SKILL.md`
- MCP server: `heroui-react` (configured in `.mcp.json`)
- Scripts: `node .agents/skills/heroui-react/scripts/list_components.mjs`

### HeroUI-First Policy & Pre-Styling Principle
When a HeroUI component already provides the styling and interactive states you need, do **not** add custom Tailwind classes or CSS overrides that fight it. Use HeroUI's built-in props, variants (`primary`, `secondary`, `tertiary`, `ghost`, `danger`), sizes, slots, compound children, or colocated `tailwind-variants` (`tv`) recipes.

### Notifications & Toasts
Always use **HeroUI Toast** (`toast.success()`, `toast.danger()`, `toast.warning()`, `toast.info()`, `toast()`) for user notifications, mutation outcomes, and error reporting. `<Toast.Provider />` is mounted at root in `src/app/providers.tsx`. Avoid bulky inline static alert banners inside cards when transient toast notifications are appropriate.

---

## Styling rules

1. **Tailwind first for layout.** Express structure and layout with Tailwind CSS v4 utility classes in markup, or with a `tailwind-variants` recipe colocated with the component.
2. **HeroUI first for components.** Use pre-styled HeroUI v3 components with minimal customization for all interactive controls (Buttons, TextFields, Inputs, Forms, Cards, Modals, Drawers, Chips, Avatars, Tabs).
3. **No raw CSS files** other than `src/styles/globals.css` (which is reserved for Tailwind/HeroUI imports, `@theme` tokens, and global resets).
4. **No inline `style={…}`** unless dynamically computed (e.g. dynamic color picker or positioning).
5. **No CSS-in-JS** libraries (emotion, styled-components, etc.).

---

## TypeScript rules

- `strict: true` (already on). Don't loosen it.
- Prefer `type` aliases over `interface` unless declaring a contract that
  consumers will extend.
- Co-locate feature types inside `src/features/<feature>/types.ts`. Promote
  to `src/types/` only when a second feature needs them.

---

## Lint / format

- ESLint config is in `eslint.config.mjs` (Flat config). It enforces
  import ordering, unused imports, and `@typescript-eslint/no-unused-vars`.
- Prettier is the formatter of record. Run `npm run lint` before opening a PR.

---

## Supabase & Database

- Local development uses the Supabase CLI (`supabase start`).
- Migrations live in `supabase/migrations/` and are forward-only.
- Client utilities live in `src/utils/supabase/` (browser, server, middleware).
- Auth is wired through `@supabase/ssr`; no direct calls to `supabase-js` from
  components — go through `src/contexts/auth_context.tsx` or typed services
  under `src/features/<feature>/services/`.

---

## What you should NOT do

- ❌ Do not put business logic, fetch calls, or stateful components inside
  `src/app/<route>/page.tsx`. Pages compose components from `src/components/` and
  `src/features/` only.
- ❌ Do not add a global CSS file other than `src/styles/globals.css`.
- ❌ Do not import across `src/features/<a>/` into `src/features/<b>/`.
  Shared code belongs in `src/components/`, `src/hooks/`, `src/types/`, or
  `src/utils/`.
- ❌ Do not introduce a `use*` hook that doesn't start with `use`.
- ❌ Do not commit `package-lock.json` churn for deps you didn't add.

---

## Commit messages

Conventional Commits matching feature scopes:

- `feat(auth): add student registration and login flow`
- `feat(proposals): implement adviser endorsement flow`
- `fix(attendance): prevent duplicate check-in timestamp`
- `docs: update technical specifications`
