---
title: Changelog
description: Voxsels release history mirrored from CHANGELOG.md.
---

# Changelog 📋

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.2] - 2026-11-25

### Added

- **departments**: map organizations to departments and surface event and participation KPIs
- **dashboard**: refine KPI cards, headers, empty states, and institutional snapshot
- **ui**: standardize catalog search bars and unified filter dropdowns
- **groups**: singularize system group names and lock initial groups from deletion

### Fixed

- **ui**: stack detail header actions, add mobile nav drawer, and keep action bars button-only

### Chore

- **db**: seed coordinated campus events, passes, and attendance data

## [0.1.1] - 2026-11-24

### Added

- **auth**: add auth callback route and configure production site URLs
- **organap**: complete event approval, attendance, navigation, and anonymized seed baseline
- **events**: complete end-to-end implementation of FR-03 through FR-18
- **navigation**: hide right panel from auth shell while preserving context infrastructure
- **layout**: introduce standard cardless PageHeader across feature pages
- **right-panel**: remove active privileges section and badge
- **sidebar**: integrate profile and signout into header and dedicate footer to collapser
- **ui**: streamline top navbar, elevate sidebar user header, and simplify 3-KPI dashboard
- **layout**: enforce 3-pane structure, hide sidebar scrollbar, and apply brand palette
- **ui**: implement voxsels 3-pane edge layout, hidden sidebar scroller, and primary blue/red/yellow palette
- **auth**: transition static roles to dynamic django-style groups and permissions
- **rbac**: implement full dynamic rbac, rls policies, and local supabase offline dev setup

### Changed

- **navigation**: optimize auth session proxy, parallelize auth queries, and add route loading skeletons
- docs — capture implementation rationale, UI/UX flows, and domain invariants
- docs — formalize heroui-first and tailwind-first styling policies from voxsels

### Fixed

- **db**: avoid email uniqueness collision in user anonymization migration
- **users**: replace raw select elements with HeroUI v3 Select and ListBox

### Chore

- **ui**: use Bowlby One SC logo font, remove navbar border, and use Select dropdown for org categories
- **groups**: tighten card spacing and prevent vertical stretch
- **groups**: remove card shield icon, add spacing above stats, and remove footer divider border
- **groups**: move settings gear action to card footer and remove updated timestamp
- **dashboard**: position kpi card icon in top-right header

## [0.1.0] - 2026-11-10

### Added

- **init**: project initialization mirroring voxsels architecture, Next.js 16 App Router, HeroUI v3, Tailwind CSS v4, and strict TypeScript.
- **docs**: full requirements specification transcript (`docs/requirements_specification.md`), architecture guide (`docs/architecture.md`), technical specifications (`docs/technical_specifications.md`), database schema design (`docs/database.md`), rationale (`docs/rationale.md`), and phased implementation plan (`docs/phased_implementation_plan.md`).
- **auth**: initial authentication feature with email/password sign-in, registration, password recovery, role-based hydration, and Supabase SSR integration.
- **dashboard**: initial role-tailored empty dashboard for students, officers, advisers, and student affairs personnel.
- **navigation**: responsive navbar, collapsible sidebar, and desktop auth shell.
- **database**: initial Supabase auth and profile schema migration with role enums (`superadmin`, `student_affairs`, `adviser`, `officer`, `student`), organizations, memberships, and automated new user triggers.
- **governance**: AGENTS.md, enforce-rules skill, and ship-and-release pipeline.
