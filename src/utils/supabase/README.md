# `src/utils/supabase/` — Supabase Clients

Contains the isolated Supabase clients across browser, server, and middleware environments.

- `client.ts`: Browser-side singleton using `createBrowserClient`.
- `server.ts`: Server-side factory reading cookies using `createServerClient`.
- `middleware.ts`: Next.js 16 proxy session refresher.
- `queries.ts`: Common cross-cutting read queries.
- `database.types.ts`: TypeScript schema types re-export.
