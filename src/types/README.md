# `src/types/` — Cross-Feature Type Definitions

This folder holds TypeScript types shared across two or more features.

## Rules

1. **Feature Types First**: Types used exclusively by a single feature belong in `src/features/<feature>/types.ts`.
2. **Promotion Rule**: Promote a type to `src/types/` only when $\ge 2$ features require it.
3. **Database Types**: `src/types/database.ts` is generated/maintained to mirror the Supabase PostgreSQL schema.
4. **Domain Types**: `src/types/domain.ts` represents app-level entities (camelCase, mapped).
