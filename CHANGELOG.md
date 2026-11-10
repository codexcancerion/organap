# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-11-10

### Added

- **init**: project initialization mirroring voxsels architecture, Next.js 16 App Router, HeroUI v3, Tailwind CSS v4, and strict TypeScript.
- **docs**: full requirements specification transcript (`docs/requirements_specification.md`), architecture guide (`docs/architecture.md`), technical specifications (`docs/technical_specifications.md`), database schema design (`docs/database.md`), rationale (`docs/rationale.md`), and phased implementation plan (`docs/phased_implementation_plan.md`).
- **auth**: initial authentication feature with email/password sign-in, registration, password recovery, role-based hydration, and Supabase SSR integration.
- **dashboard**: initial role-tailored empty dashboard for students, officers, advisers, and student affairs personnel.
- **navigation**: responsive navbar, collapsible sidebar, and desktop auth shell.
- **database**: initial Supabase auth and profile schema migration with role enums (`superadmin`, `student_affairs`, `adviser`, `officer`, `student`), organizations, memberships, and automated new user triggers.
- **governance**: AGENTS.md, enforce-rules skill, and ship-and-release pipeline.
