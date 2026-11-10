# `supabase/` — Database Configuration & Migrations

This folder manages the PostgreSQL schema, migrations, RLS policies, and seed data for OrGanap.

## Architecture

- `config.toml` — Local Supabase CLI configuration (ports, authentication, storage buckets).
- `migrations/` — Forward-only SQL migrations.
  - `20250101000000_init_organap_auth.sql` — Profiles, roles, organizations, memberships, venues, and `handle_new_user` trigger.
- `seed.sql` — Development seeds (campus organizations and venues).

## Commands

```bash
npm run db:start   # Start local Supabase instance
npm run db:stop    # Stop local Supabase
npm run db:reset   # Reset database and apply all migrations & seed
npm run db:diff    # Generate migration from schema diff
npm run db:types   # Regenerate TypeScript definitions in src/types/database.ts
```
