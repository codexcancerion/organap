# `src/app/` — Next.js 16 App Router Routes

This folder defines URL routing and layout shells using the Next.js 16 App Router.

## Invariants

1. **Composition Only**: `page.tsx` files compose layout components and feature components. Business logic, state manipulation (`useState`, `useEffect`), and direct Supabase calls do NOT belong inside `page.tsx`.
2. **Route Groups**:
   - `(public)/`: Unauthenticated landing and auth entry points (`/login`, `/register`, `/forgotpassword`, `/reset-password`).
   - `(auth)/`: Protected pages (`/dashboard`, `/profile`, `/settings`, `/proposals`, `/attendance`).
3. **No 'use client' on Route Pages**: Keep `page.tsx` as Server Components that hydrate user data via `getCurrentUser()` and pass props to client components.
