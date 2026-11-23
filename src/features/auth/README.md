# `src/features/auth/` — Authentication & Profiles

This feature manages user sign-in, registration, password recovery, profile hydration, avatar uploads, self-service security actions, and session persistence.

## Architecture

- `types.ts` — `AuthUser`, `SignInInput`, `SignUpInput`, `AuthResult`, `ProfileOverview`, `ProfileOrgMembership`.
- `services/auth_services.tsx` — Browser-side Supabase Auth operations (`signInWithPassword`, `signUpWithPassword`, `signOut`, `hydrateAuthUser`, `uploadProfileAvatar`, `updateProfile`, `updateUserPassword`).
- `services/auth_queries.tsx` — Server-side cached queries (`getCurrentUser`, `getProfileOverview`).
- `components/` — HeroUI v3 UI components (`LoginForm`, `RegisterForm`, `AuthCard`, `ForgotPasswordForm`, `ResetPasswordForm`, `ProfileForm`, `ProfileSecurityCard`, `ProfileView`).

## Invariants

1. Do NOT talk to `@supabase/supabase-js` or `@supabase/ssr` directly from components. Call `useAuth()` or `auth_services.tsx`.
2. Do NOT import from other feature directories; use shared primitives such as `@/components/ui/image_crop_uploader`.
