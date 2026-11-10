# `src/features/auth/` — Authentication & Profiles

This feature manages user sign-in, registration, password recovery, profile hydration, and session persistence.

## Architecture

- `types.ts` — `AppRole`, `AuthUser`, `SignInInput`, `SignUpInput`, `AuthResult`.
- `services/auth_services.tsx` — Browser-side Supabase Auth operations (`signInWithPassword`, `signUpWithPassword`, `signOut`, `hydrateAuthUser`).
- `services/auth_queries.tsx` — Server-side cached query (`getCurrentUser`).
- `components/` — HeroUI v3 UI components (`LoginForm`, `RegisterForm`, `AuthCard`, `ForgotPasswordForm`, `ResetPasswordForm`, `ProfileForm`).

## Invariants

1. Do NOT talk to `@supabase/supabase-js` or `@supabase/ssr` directly from components. Call `useAuth()` or `auth_services.tsx`.
2. Do NOT import from other feature directories.
