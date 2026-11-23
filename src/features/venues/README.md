# `src/features/venues/` — Campus Venues & Facilities

Manages authorized campus event venues (`public.venues`) with custom icons, preset palette colors, capacity governance, availability toggles, and booking schedule views (FR-07).

## Permissions

- **View Active Venues (`/venues`, `/venues/[id]`)**: Active venues (`is_active = true`) are visible to authenticated users; `venues.view` reveals Maintenance/Inactive venues (`venues_select` RLS).
- `venues.create` — Enables `Add Venue` creation modal (`venues_insert` RLS).
- `venues.change` — Enables `Settings` update modal for facility details, availability, icon, and color (`venues_update` RLS).
- `venues.delete` — Enables destructive deletion inside `VenueModal`'s `<DangerZoneSection />` with FK protection against linked `event_proposals` (`venues_delete` RLS).

## Architecture

- `constants.ts` — Curated facility icon registry, color palette swatches, and color validation helpers.
- `types.ts` — Domain types (`VenueListItem`, `VenueDetail`, `VenueFormValues`, `VenuePermissions`).
- `services/venue_queries.ts` — Cached server queries (`getVenues`, `getVenueById`).
- `services/venue_services.ts` — Validation (`validateVenueInput`) and mutations (`createVenue`, `updateVenue`, `deleteVenue`).
- `components/` — HeroUI v3 UI (`VenueIconBadge`, `VenueCatalog`, `VenueDetailView`, `VenueModal`).
