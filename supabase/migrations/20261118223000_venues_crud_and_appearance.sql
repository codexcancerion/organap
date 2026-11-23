-- =============================================================================
-- OrGanap — Campus Venues CRUD Hardening & Custom Icon / Color Appearance
-- Migration: 20261118223000_venues_crud_and_appearance.sql
--
-- 1. Adds `icon`, `color`, and `updated_at` columns to `public.venues`
-- 2. Enforces `capacity > 0`, color format check, and unique trimmed venue names
-- 3. Assigns fitting colored icons to initial seeded campus venues
-- =============================================================================

alter table public.venues
  add column if not exists icon text not null default 'building-2',
  add column if not exists color text not null default 'accent',
  add column if not exists updated_at timestamptz not null default now();

-- Ensure constraints exist idempotently
alter table public.venues
  drop constraint if exists check_venue_capacity;
alter table public.venues
  add constraint check_venue_capacity check (capacity > 0);

alter table public.venues
  drop constraint if exists check_venue_icon;
alter table public.venues
  add constraint check_venue_icon check (char_length(trim(icon)) > 0);

alter table public.venues
  drop constraint if exists check_venue_color;
alter table public.venues
  add constraint check_venue_color check (
    color in ('accent', 'blue', 'indigo', 'violet', 'emerald', 'teal', 'amber', 'orange', 'rose')
    or color ~ '^#[0-9a-fA-F]{6}$'
  );

create unique index if not exists venues_name_idx
  on public.venues (lower(trim(name)));

grant select, insert, update, delete on public.venues to authenticated, service_role;

-- Backfill fitting colored icon defaults for seeded campus venues if uncustomized
update public.venues
set
  icon = case lower(trim(name))
    when 'university main auditorium' then 'theater'
    when 'university gymnasium' then 'trophy'
    when 'multi-purpose hall (mph)' then 'landmark'
    when 'audio-visual room 1 (avr 1)' then 'monitor-play'
    when 'audio-visual room 2 (avr 2)' then 'presentation'
    else icon
  end,
  color = case lower(trim(name))
    when 'university main auditorium' then 'blue'
    when 'university gymnasium' then 'emerald'
    when 'multi-purpose hall (mph)' then 'indigo'
    when 'audio-visual room 1 (avr 1)' then 'violet'
    when 'audio-visual room 2 (avr 2)' then 'teal'
    else color
  end
where icon = 'building-2' and color = 'accent';
