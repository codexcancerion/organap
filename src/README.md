# `src/` — OrGanap Application Source

This directory contains the entire application codebase following the canonical layout:

```
src/
  app/           ← Next.js 16 App Router (pages, layouts, route handlers)
  components/    ← Shared UI (layout shells, persistent navigation, ui primitives)
  config/        ← Static configuration (site metadata, fonts)
  contexts/      ← App-wide React contexts (AuthContext, Providers)
  features/      ← Hermetic product verticals (auth, dashboard, organizations, proposals, events, registrations, attendance, reports)
  hooks/         ← Cross-feature hooks (useIsMobile, etc.)
  styles/        ← Single global stylesheet (globals.css)
  types/         ← Cross-feature TypeScript types (domain.ts, database.ts)
  utils/         ← Pure helpers and Supabase clients (client, server, middleware, queries)
  proxy.ts       ← Next.js 16 session proxy
```
