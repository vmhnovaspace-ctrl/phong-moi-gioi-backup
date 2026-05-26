-- Module 05: prepare Google Maps location fields for buildings.
-- This is additive only and does not change existing RLS policies.

begin;

alter table public.buildings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists formatted_address text,
  add column if not exists google_place_id text;

create index if not exists idx_buildings_google_place_id
  on public.buildings(google_place_id)
  where google_place_id is not null;

create index if not exists idx_buildings_latitude_longitude
  on public.buildings(latitude, longitude)
  where latitude is not null and longitude is not null;

commit;
