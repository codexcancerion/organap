# OrGanap Card Standard

**OrGanap v0.1.0** | UI/UX Component Specification

All entity catalog and summary cards across OrGanap follow a unified **HeroUI v3 Card Standard** to keep visual hierarchy, interaction targets, icon alignment, and permission-gated actions consistent across every feature slice.

---

## 1. Anatomy & Compound Structure

Cards MUST use HeroUI v3 compound subcomponents (`<Card>`, `<Card.Header>`, `<Card.Title>`, `<Card.Description>`, `<Card.Content>`, `<Card.Footer>`). Never pass HeroUI v2 flat props such as `title="…"` on `<Card>`.

```tsx
<Card className="relative group h-full justify-between gap-3 hover:border-accent/40 transition-colors cursor-pointer">
  <Card.Header className="flex flex-col gap-2">
    <div className="flex items-start justify-between gap-2 w-full">
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        {/* Top-aligned icon box */}
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
          {code}
        </div>
        <div className="flex flex-col min-w-0">
          <Card.Title className="truncate group-hover:text-accent transition-colors">
            {title}
          </Card.Title>
          <Card.Description className="line-clamp-2">
            {subtitle}
          </Card.Description>
        </div>
      </div>

      {/* Optional single header status/category chip */}
      <Chip className="shrink-0" size="sm" variant="soft">
        {statusLabel}
      </Chip>
    </div>
  </Card.Header>

  <Card.Content className="flex flex-col gap-2">
    {/* Concise entity metadata or chips */}
  </Card.Content>

  <Card.Footer className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
    {/* Left: auxiliary info OR icon-only Settings button (z-10) */}
    {/* Right: primary action or View Details stretched link */}
  </Card.Footer>
</Card>
```

---

## 2. Mandatory Layout & Alignment Rules

1. **Top-Aligned Leading Icon (`items-start`)**:
   - The flex container pairing the `w-10 h-10` icon box with `<Card.Title>` / `<Card.Description>` **MUST** use `items-start` (never `items-center`).
   - Rationale: When titles or descriptions wrap across 2+ lines, `items-center` causes the icon to drift vertically into the middle of the header block; `items-start` keeps every card icon aligned cleanly to the top edge across grid rows.
2. **Standard Soft-Accent Icon Badge**:
   - Text/acronym badges and entity icons use `w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs` (up to 4 acronym characters, e.g. `BSIT`, `CCJE`, `JPIA`).
   - Entities with uploaded raster logos (such as `organizations`) render `<Avatar className="w-10 h-10 rounded-xl bg-accent/10 text-accent shrink-0">` with `<Avatar.Fallback className="bg-accent/10 text-accent text-xs font-bold rounded-xl">`.
   - Configurable facility entities (`venues`) use the same `w-10 h-10 rounded-xl` container via `<VenueIconBadge />`, defaulting to `bg-accent/10 text-accent` or applying the venue's chosen semantic swatch / hex tint.
3. **Full-Card Clickability Without Nested Interactive Elements**:
   - When a card navigates to a `/[id]` detail route, make the entire `<Card>` clickable using a **stretched `<NextLink>`** inside `<Card.Footer>` (`after:absolute after:inset-0 after:content-['']`) rather than wrapping `<Card>` inside `<NextLink>`.
   - Any auxiliary button inside the card (such as the icon-only `Settings` trigger) **MUST** carry `relative z-10` so it sits above the stretched link overlay and never triggers navigation when clicked.
4. **Card Footer Regions (`<Card.Footer>`)**:
   - **Bottom-Left**: Secondary metadata (e.g. duration, booking count, acronym fallback) **or** the permission-gated icon-only `Settings` button (`<Button isIconOnly aria-label="Settings for …" className="relative z-10" size="sm" variant="ghost"><Settings size={15} /></Button>`).
   - **Bottom-Right**: All `View Details ->` links (`ml-auto`) or primary card action buttons (e.g. `Configure Permissions`, or icon-only `Settings` on entities without a detail route such as Semesters).
5. **Settings & Danger Zone Consolidation**:
   - Catalog cards do **not** render separate inline Edit and Delete buttons.
   - A single icon-only `Settings` button opens the entity's Settings modal, which embeds `<DangerZoneSection />` (`src/components/ui/danger_zone_section.tsx`) for destructive deletion (gated by `*.delete` and confirmed via `<ConfirmDeleteModal />`).
6. **Chip Hygiene**:
   - At most **1** status/category `<Chip>` in the top `<Card.Header>` bar.
   - When listing child relationships inside `<Card.Content>` (such as Department to Programs), omit redundant `"N Programs"` count labels and show up to **5** code chips (`slice(0, 5)`), a `...` overflow chip when more than 5 exist, or a muted `"No programs yet"` chip (`variant="secondary"`, `className="text-muted opacity-70"`) when empty.
7. **Two-Tier Header Exception for Long Multi-Word Event Cards (`<EventCatalog />`)**:
   - Cards pairing a long event title with a wide registration `<Chip>` such as `Open for Registration` promote the organization `w-9 h-9` avatar/badge and stacked identity to the top header row alongside the status `<Chip>`, then render `<Card.Title className="line-clamp-2">` plus compact `activityType` and `semesterName` chips across the full width below.
   - Event venue and schedule metadata live in an inset summary box (`rounded-xl bg-default/5 p-3 border border-border/30 mt-auto`), and `<Card.Footer>` combines compact organization/author attribution with `shrink-0 whitespace-nowrap` on the stretched `<NextLink>` so action labels such as `View Details` never wrap across lines.
