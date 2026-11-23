# `src/components/navigation/`: Chrome & Navigation Components

Persistent navigation chrome and layout shells across OrGanap:
- `navbar.tsx`: Header navbar with public visitor links when logged out, or left contextual breadcrumbs (`nav_breadcrumbs.tsx`) and right command search palette (`command_search.tsx`) alongside notifications and theme toggle when authenticated.
- `nav_breadcrumbs.tsx`: HeroUI `Breadcrumbs` + `Separator` header trail resolved from Next.js pathname and dynamic document metadata titles.
- `command_search.tsx`: Right-aligned `Ctrl/Cmd+K` search trigger and HeroUI `Modal` + `SearchField` command palette querying permission-gated navigation plus RLS-scoped `/api/search` results.
- `sidebar.tsx`: Collapsible left-edge docked navigation sidebar with persisted collapse state and permission-gated links.
- `right_panel.tsx`: Collapsible right-edge docked contextual panel with preset cycling, resizer handle, and dynamic page-driven render slots.
- `auth_shell.tsx`: Authenticated app layout shell orchestrating the left edge-docked sidebar and centered content area.

## Sidebar Group Taxonomy (`sidebar.tsx`)

Navigation items in `<Sidebar />` split into three semantic groups to separate daily student participation from institutional configuration and system administration:
- **`EVENTS`**: Action-oriented campus activity links (`Events`, `My Passes`, `Attendance`) used by students, officers, and event coordinators.
- **`INSTITUTION`**: Campus governance and structural registries (`Organizations`, `Venues`, and permission-gated `Attachments`, `Semesters`, `Departments`, `Programs`). Why place **Attachments** (`/attachments`) under **Institution** rather than Events or Administration? Attachment requirement types are institutional policy templates defined across semesters alongside campus venues and academic departments, not user/role administration or per-student event browsing.
- **`ADMINISTRATION`**: System and audit controls (`Users`, `Groups`) gated to staff or superusers, with personal `Settings` pinned once at the bottom footer and attendance exports unified into `Attendance`.
