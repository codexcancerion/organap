# `src/features/organizations/`: Recognized Organizations

Manages campus student organizations, officer rosters, categories, leadership governance, and event schedules (FR-01, FR-02).

## 1. Domain Rationale & Business Rules

- **KCP Recognized Roster & Affiliated Account Invariant**:
  - Local seeds mirror the 10 active King's College of the Philippines student organizations from `soams-kcp` alongside their student officers, general members, Faculty Advisers, and real OSAS personnel and director accounts.
  - Why exclude unaffiliated student accounts and placeholder OSAS Director ID `100000`? Demo or unattached student rows and fixture accounts like `100000` distort roster counts, allow unrealistic approval workflows, and clutter permission testing; tying seeded accounts strictly to recognized KCP organizations and real OSAS reviewers ensures every RBAC and workflow path mirrors production campus operations.
- **Auto-Generated Permalink Slugs**: URL slugs (`organizations.slug`) are omitted from creation and settings forms to eliminate administrative friction during organization recognition. `generateOrganizationSlug` derives deterministic kebab-case slugs from the organization name, falling back to acronym or random short token, and appends a unique suffix if `organizations_slug_key` collides.
- **Stable Edit Permalinks**: `updateOrganizationInfo` preserves the existing `organization.slug` so renaming an organization or acronym in Settings never breaks existing bookmarks or storage asset links.
- **Optional & Mutually Exclusive Initial Leadership**: Creating an organization does not block on filling governance seats; both `Governor` and `Adviser` default to `"Unassigned (Optional)"` and can be updated post-recognition via `ManageLeadersModal`. When both are selected, `disabledKeys` prevents assigning the same user as both Student Governor and Faculty Adviser simultaneously.
- **Safety Locks on Self-Reassignment**: Active organization leaders cannot remove or reassign their own governance role without Student Affairs override (`canUpdateAllOrganizations`), preventing accidental lockouts or orphaned proposal review chains.
- **Danger Zone Containment**: Permanent organization deletion (`Delete Organization`) is intentionally removed from the top page header and housed inside the **Organization Settings** modal's Danger Zone, preventing misclicks next to primary editing actions and routing through `DeleteOrganizationModal` (`<AlertDialog />`).

## 2. Thresholds, Bounds & Storage Pipeline

- **Upload Validation Cap (`MAX_INPUT_BYTES`)**: `10 MiB` client-side pre-crop guard across `PNG`, `JPG`, and `WebP` inputs.
- **Interactive Crop Viewport (`CROP_FRAME_SIZE`)**: `208×208 px` square viewport; cover-scaled (`Math.max`) with clamped pan offsets and `1.0×`–`3.0×` zoom so cropped logos never expose blank gaps.
- **Normalized Storage Output (`OUTPUT_DIMENSION`)**: Offscreen `512×512 px` canvas compressed at `0.82` quality as `image/webp`, falling back automatically to `image/jpeg` in environments lacking WebP `canvas.toBlob` support.
- **Supabase Storage (`organap-assets`)**: Public bucket capped at `5 MiB` (`5242880` bytes) with folder-scoped RLS policies (`organizations/*`) authorizing creators, superusers, staff, organization officers (`organizations.change*`), governors, and advisers.

## 3. UI/UX Architecture & Technical Choices

- **Detail Header Discipline (`/organizations/[id]`)**:
  - Uses unified `<PageHeader />` with standardized breadcrumbs (`Back to Organizations / <ACRONYM>`).
  - Restricts header chips to strictly one status `<Chip />` (`Recognized & Active` / `Inactive`), omits metadata rows below the description, and omits header KPI cards.
  - Exposes a single HeroUI `<Button size="sm" variant="secondary">` (`Settings`) in `actions`.
- **Single-Preview Logo Cropper (`OrganizationLogoUploader`)**:
  - Avoids duplicate `"Final Compressed Preview"` panes because the live `<Avatar />` summary card below already previews the cropped result alongside org metadata.
  - Positions the `- / +` HeroUI `<Slider />` directly below the square crop box without redundant `"Zoom"` text or numeric readout labels.
  - Uses an icon-only soft-red Reset `<Button isIconOnly variant="danger-soft">` and displays size reduction strictly as a compact percentage (`"{savingsPercent}% smaller"`), keeping `Change Image` and `Remove` uncluttered on the right.
- **HeroUI v3 `<Switch />` Canonical Anatomy**: Places `<Switch.Control>` inside `<Switch.Content>` beside `<Label>`, keeping `<Description>` as a direct child of `<Switch>` so helper text aligns vertically underneath rather than inline beside the label.
- **Flex-Scroll Modal Framing**: All organization modals (`CreateOrganizationModal`, `EditOrganizationModal`, `AddMemberModal`, `ManageLeadersModal`) pair `<Modal.Container scroll="inside">` and `max-h-[88dvh]` on `<Modal.Dialog>` with `shrink-0` headers/footers and `className="flex flex-col flex-1 min-h-0 overflow-hidden"` on `<Form>` so `<Modal.Body>` scrolls internally instead of pushing or clipping header/footer edges.

## 4. Interaction Flows & Navigation Topology

- **3-Step Registration Wizard (`CreateOrganizationModal`)**:
  - Concise single-word HeroUI `<Button />` step indicators (**`Identity`**, **`Leadership`**, **`Logo`**) prevent truncation across smaller containers.
  - Step progression uses a simple **`Next`** footer button until Step 3 (**`Create Organization`**).
  - Step 2 uses concise **`Governor`** and **`Adviser`** labels with optional placeholders (`"Unassigned (Optional)"`) and omits field-level description paragraphs.
- **Two-Stage Settings -> Danger Flow**: Header `Settings` `<Button />` -> `EditOrganizationModal` (`"Organization Settings"`) -> **Danger Zone** `Delete Organization` `<Button variant="danger">` -> `onRequestDelete` closes Settings cleanly and launches `<DeleteOrganizationModal />` confirmation (`<AlertDialog />`).
- **Keyed Form Reset Invariant**: `EditOrganizationModal` mounts `<EditOrganizationForm key={organization.id} ... />` conditionally on `isOpen && canEdit` instead of resetting state inside `React.useEffect` (satisfying ESLint `react-hooks/set-state-in-effect`).

## 5. Non-Obvious Edge Cases & Invariants

- **PostgreSQL Nullable UUID Coercion**: Optional leadership IDs convert empty strings (`""`) to `null` / `undefined` before RPC submission so Postgres never raises `invalid input syntax for type uuid: ""`.
- **80ms Canvas Compression Debounce & URL Revocation**: `OrganizationLogoUploader` debounces canvas compression during pointer drags/slider changes and revokes stale `URL.createObjectURL` handles on replacement and unmount to prevent memory leaks.
- **Read-Only + Delete Permission Split**: When `canEdit === false` and `canDelete === true`, `Organization Settings` omits editable form fields and `Save Changes`, rendering only the Danger Zone card and a `Close` action.
