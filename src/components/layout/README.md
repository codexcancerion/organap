# `src/components/layout/` — Page Layout Shells

Section and page wrappers used to enforce layout consistency across features.

- `page_header.tsx`: Standard cardless page header primitive featuring optional breadcrumbs (`PageBreadcrumbItem[]`, standard across all `/[id]` and `/new` routes so back-navigation lives consistently inside `<header>`), optional leading `media`, primary title, strictly one status/count `badge` chip (to eliminate multi-badge clutter), subtitle, optional inline `meta` (omitted on hero-first headers like `/organizations/[id]`), and rightmost action controls (`actions`, reserved for buttons rather than KPI cards).
- `section.tsx`: Unified feature section primitive featuring optional leading `icon`, `title` (`h2`/`h3`), single `badge`, `description`, right-aligned `actions`, optional top `bordered` divider, and `"stack"` (default in authenticated views) / `"container"` (outer landing/public spacing) variants.
- `legal_document_shell.tsx`: Reusable public legal documentation layout composing `<PageHeader />`, HeroUI `<Alert />`, and sectioned `<Card />` content for `/privacy` and `/terms`.
