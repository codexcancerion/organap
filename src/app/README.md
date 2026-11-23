# `src/app/` — Next.js 16 App Router Routes

This folder defines URL routing and layout shells using the Next.js 16 App Router.

## Invariants

1. **Composition Only**: `page.tsx` files compose layout components and feature components. Business logic, state manipulation (`useState`, `useEffect`), and direct Supabase calls do NOT belong inside `page.tsx`.
2. **Route Groups**:
   - `(public)/`: Unauthenticated auth entry points (`/login`, `/register`, `/forgotpassword`, `/reset-password`), alongside root public pages (`/`, `/privacy`, `/terms`).
   - `(auth)/`: Protected pages (`/dashboard`, `/notifications`, `/events`, `/registrations`, `/attendance`, `/organizations`, `/venues`, `/attachments`, `/semesters`, `/departments`, `/programs`, `/profile`, `/settings`, `/admin/users`, `/admin/groups`), plus compatibility redirects for `/proposals/*`, `/reports/*`, and `/admin/venues`.
3. **No 'use client' on Route Pages**: Keep `page.tsx` as Server Components that hydrate user data via `getCurrentUser()` and pass props to client components.
