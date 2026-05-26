-- Module 02 — Database Schema Supabase
-- Project: Kho Phong Realtime MVP v1
-- Run this file in Supabase SQL Editor.

begin;

-- =========================================================
-- 1. EXTENSIONS
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- 2. ENUM TYPES
-- =========================================================
do $$ begin
  create type public.user_role as enum ('admin', 'landlord', 'broker');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('pending', 'active', 'blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.room_status as enum ('available', 'coming_soon', 'reserved', 'rented', 'hidden');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.visibility_status as enum ('visible', 'hidden');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.image_source_type as enum ('uploaded', 'google_drive_link', 'external_url');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.image_type as enum ('main', 'room', 'bathroom', 'kitchen', 'balcony', 'building', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.permission_status as enum ('pending', 'approved', 'blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_type as enum ('rented', 'wrong_price', 'wrong_images', 'wrong_info', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open', 'reviewing', 'resolved', 'rejected');
exception when duplicate_object then null; end $$;

-- =========================================================
-- 3. HELPER FUNCTIONS
-- =========================================================
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.status = 'active'
  );
end;
$$;

create or replace function public.is_active_user()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
  );
end;
$$;

create or replace function public.current_role()
returns public.user_role
language plpgsql
security definer
set search_path = public
stable
as $$
declare v_role public.user_role;
begin
  select p.role into v_role from public.profiles p where p.id = auth.uid() limit 1;
  return v_role;
end;
$$;

create or replace function public.can_broker_view_landlord(target_landlord_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'landlord'
        and p.status = 'active'
        and p.id = target_landlord_id
    )
    or exists (
      select 1
      from public.landlord_broker_permissions lbp
      join public.profiles broker on broker.id = lbp.broker_id
      where lbp.landlord_id = target_landlord_id
        and lbp.broker_id = auth.uid()
        and lbp.status = 'approved'
        and broker.role = 'broker'
        and broker.status = 'active'
    );
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.generate_slug(prefix text)
returns text
language sql
volatile
as $$
  select lower(prefix || '-' || encode(gen_random_bytes(6), 'hex'));
$$;

-- =========================================================
-- 4. TABLES
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  email text unique,
  role public.user_role not null default 'broker',
  status public.user_status not null default 'pending',
  avatar_url text,
  public_slug text not null unique default public.generate_slug('u'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_phone_len check (phone is null or length(phone) between 8 and 20)
);

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text not null,
  ward text,
  district text,
  city text not null default 'TP.HCM',
  google_maps_url text,
  description text,
  common_amenities text,
  house_rules text,
  building_drive_folder_url text,
  cover_image_url text,
  public_slug text not null unique default public.generate_slug('b'),
  visibility public.visibility_status not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  room_code text not null,
  title text,
  floor text,
  area_m2 numeric(8,2) check (area_m2 is null or area_m2 > 0),
  rent_price integer not null check (rent_price >= 0),
  deposit_amount integer check (deposit_amount is null or deposit_amount >= 0),
  max_people integer check (max_people is null or max_people > 0),
  status public.room_status not null default 'hidden',
  available_from date,
  commission text,
  description text,
  strengths text,
  weaknesses text,
  room_drive_folder_url text,
  cover_image_url text,
  public_slug text not null unique default public.generate_slug('r'),
  visibility public.visibility_status not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, room_code)
);

create table if not exists public.room_fees (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.rooms(id) on delete cascade,
  electricity_price text,
  water_price text,
  parking_fee text,
  service_fee text,
  internet_fee text,
  management_fee text,
  other_fees text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_features (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.rooms(id) on delete cascade,
  has_window boolean not null default false,
  has_balcony boolean not null default false,
  has_private_bathroom boolean not null default false,
  has_private_kitchen boolean not null default false,
  has_washing_machine boolean not null default false,
  has_elevator boolean not null default false,
  has_air_conditioner boolean not null default false,
  has_fridge boolean not null default false,
  has_bed boolean not null default false,
  has_wardrobe boolean not null default false,
  allows_pet boolean not null default false,
  is_furnished boolean not null default false,
  has_parking boolean not null default false,
  has_security boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.building_images (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  image_url text not null,
  storage_path text,
  source_type public.image_source_type not null,
  image_type public.image_type not null default 'building',
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  image_url text not null,
  storage_path text,
  source_type public.image_source_type not null,
  image_type public.image_type not null default 'room',
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.landlord_broker_permissions (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  broker_id uuid not null references public.profiles(id) on delete cascade,
  status public.permission_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (landlord_id, broker_id),
  constraint lbp_not_same_user check (landlord_id <> broker_id)
);

create table if not exists public.broker_room_actions (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  is_saved boolean not null default false,
  posted_chotot boolean not null default false,
  posted_mogi boolean not null default false,
  posted_facebook boolean not null default false,
  sent_to_customer boolean not null default false,
  customer_note text,
  private_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (broker_id, room_id)
);

create table if not exists public.room_status_logs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  old_status public.room_status,
  new_status public.room_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.room_reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  broker_id uuid not null references public.profiles(id) on delete cascade,
  report_type public.report_type not null,
  message text,
  status public.report_status not null default 'open',
  admin_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 5. TRIGGERS
-- =========================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','buildings','rooms','room_fees','room_features',
    'landlord_broker_permissions','broker_room_actions','room_reports'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

create or replace function public.log_room_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.room_status_logs(room_id, old_status, new_status, changed_by, note)
    values (new.id, null, new.status, auth.uid(), 'initial_status');
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.room_status_logs(room_id, old_status, new_status, changed_by, note)
    values (new.id, old.status, new.status, auth.uid(), 'status_changed');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_rooms_status_log on public.rooms;
create trigger trg_rooms_status_log
after insert or update of status on public.rooms
for each row execute function public.log_room_status_change();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'New user'),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'broker'),
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- 6. INDEXES
-- =========================================================
create index if not exists idx_profiles_role_status on public.profiles(role, status);
create index if not exists idx_profiles_public_slug on public.profiles(public_slug);

create index if not exists idx_buildings_landlord on public.buildings(landlord_id);
create index if not exists idx_buildings_location on public.buildings(city, district, ward);
create index if not exists idx_buildings_visibility on public.buildings(visibility);
create index if not exists idx_buildings_public_slug on public.buildings(public_slug);
create index if not exists idx_buildings_updated_at on public.buildings(updated_at desc);

create index if not exists idx_rooms_building on public.rooms(building_id);
create index if not exists idx_rooms_status on public.rooms(status);
create index if not exists idx_rooms_price on public.rooms(rent_price);
create index if not exists idx_rooms_available_from on public.rooms(available_from);
create index if not exists idx_rooms_public_slug on public.rooms(public_slug);
create index if not exists idx_rooms_updated_at on public.rooms(updated_at desc);
create index if not exists idx_rooms_filter_core on public.rooms(status, rent_price, updated_at desc);

create index if not exists idx_room_features_lookup on public.room_features(room_id);
create index if not exists idx_room_fees_lookup on public.room_fees(room_id);
create index if not exists idx_building_images_building_sort on public.building_images(building_id, sort_order);
create index if not exists idx_room_images_room_sort on public.room_images(room_id, sort_order);
create index if not exists idx_lbp_landlord_status on public.landlord_broker_permissions(landlord_id, status);
create index if not exists idx_lbp_broker_status on public.landlord_broker_permissions(broker_id, status);
create index if not exists idx_broker_actions_broker on public.broker_room_actions(broker_id);
create index if not exists idx_broker_actions_saved on public.broker_room_actions(broker_id, is_saved) where is_saved = true;
create index if not exists idx_room_status_logs_room_created on public.room_status_logs(room_id, created_at desc);
create index if not exists idx_room_reports_status on public.room_reports(status, created_at desc);
create index if not exists idx_room_reports_room on public.room_reports(room_id);

-- =========================================================
-- 7. USEFUL VIEWS FOR DASHBOARDS
-- =========================================================
create or replace view public.v_building_room_counts as
select
  b.id as building_id,
  b.landlord_id,
  count(r.id) as total_rooms,
  count(r.id) filter (where r.status = 'available') as available_rooms,
  count(r.id) filter (where r.status = 'coming_soon') as coming_soon_rooms,
  count(r.id) filter (where r.status in ('available','coming_soon')) as broker_visible_rooms
from public.buildings b
left join public.rooms r on r.building_id = b.id
where b.visibility = 'visible'
group by b.id, b.landlord_id;

create or replace view public.v_broker_rooms as
select
  r.*,
  b.name as building_name,
  b.address,
  b.ward,
  b.district,
  b.city,
  b.landlord_id
from public.rooms r
join public.buildings b on b.id = r.building_id
where r.visibility = 'visible'
  and b.visibility = 'visible'
  and r.status in ('available', 'coming_soon');

-- =========================================================
-- 8. ENABLE RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.buildings enable row level security;
alter table public.rooms enable row level security;
alter table public.room_fees enable row level security;
alter table public.room_features enable row level security;
alter table public.building_images enable row level security;
alter table public.room_images enable row level security;
alter table public.landlord_broker_permissions enable row level security;
alter table public.broker_room_actions enable row level security;
alter table public.room_status_logs enable row level security;
alter table public.room_reports enable row level security;

-- =========================================================
-- 9. RLS POLICIES
-- =========================================================
-- PROFILES
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
for select using (
  public.is_admin()
  or id = auth.uid()
  or (public.is_active_user() and status = 'active')
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- BUILDINGS
drop policy if exists "buildings_select" on public.buildings;
create policy "buildings_select" on public.buildings
for select using (
  public.is_admin()
  or landlord_id = auth.uid()
  or (
    visibility = 'visible'
    and public.can_broker_view_landlord(landlord_id)
  )
);

drop policy if exists "buildings_insert_landlord" on public.buildings;
create policy "buildings_insert_landlord" on public.buildings
for insert with check (
  landlord_id = auth.uid()
  and public.current_role() = 'landlord'
  and public.is_active_user()
);

drop policy if exists "buildings_update_owner_admin" on public.buildings;
create policy "buildings_update_owner_admin" on public.buildings
for update using (landlord_id = auth.uid() or public.is_admin())
with check (landlord_id = auth.uid() or public.is_admin());

drop policy if exists "buildings_delete_owner_admin" on public.buildings;
create policy "buildings_delete_owner_admin" on public.buildings
for delete using (landlord_id = auth.uid() or public.is_admin());

-- ROOMS
drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select" on public.rooms
for select using (
  public.is_admin()
  or exists (
    select 1 from public.buildings b
    where b.id = rooms.building_id
      and (
        b.landlord_id = auth.uid()
        or (
          b.visibility = 'visible'
          and rooms.visibility = 'visible'
          and rooms.status in ('available','coming_soon','reserved')
          and public.can_broker_view_landlord(b.landlord_id)
        )
      )
  )
);

drop policy if exists "rooms_insert_owner_admin" on public.rooms;
create policy "rooms_insert_owner_admin" on public.rooms
for insert with check (
  public.is_admin()
  or exists (select 1 from public.buildings b where b.id = building_id and b.landlord_id = auth.uid())
);

drop policy if exists "rooms_update_owner_admin" on public.rooms;
create policy "rooms_update_owner_admin" on public.rooms
for update using (
  public.is_admin()
  or exists (select 1 from public.buildings b where b.id = rooms.building_id and b.landlord_id = auth.uid())
)
with check (
  public.is_admin()
  or exists (select 1 from public.buildings b where b.id = rooms.building_id and b.landlord_id = auth.uid())
);

drop policy if exists "rooms_delete_owner_admin" on public.rooms;
create policy "rooms_delete_owner_admin" on public.rooms
for delete using (
  public.is_admin()
  or exists (select 1 from public.buildings b where b.id = rooms.building_id and b.landlord_id = auth.uid())
);

-- ROOM FEES + FEATURES: inherit room access
drop policy if exists "room_fees_select" on public.room_fees;
create policy "room_fees_select" on public.room_fees
for select using (exists (select 1 from public.rooms r where r.id = room_id));

drop policy if exists "room_fees_manage_owner_admin" on public.room_fees;
create policy "room_fees_manage_owner_admin" on public.room_fees
for all using (
  public.is_admin()
  or exists (
    select 1 from public.rooms r join public.buildings b on b.id = r.building_id
    where r.id = room_fees.room_id and b.landlord_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.rooms r join public.buildings b on b.id = r.building_id
    where r.id = room_fees.room_id and b.landlord_id = auth.uid()
  )
);

drop policy if exists "room_features_select" on public.room_features;
create policy "room_features_select" on public.room_features
for select using (exists (select 1 from public.rooms r where r.id = room_id));

drop policy if exists "room_features_manage_owner_admin" on public.room_features;
create policy "room_features_manage_owner_admin" on public.room_features
for all using (
  public.is_admin()
  or exists (
    select 1 from public.rooms r join public.buildings b on b.id = r.building_id
    where r.id = room_features.room_id and b.landlord_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.rooms r join public.buildings b on b.id = r.building_id
    where r.id = room_features.room_id and b.landlord_id = auth.uid()
  )
);

-- IMAGES
drop policy if exists "building_images_select" on public.building_images;
create policy "building_images_select" on public.building_images
for select using (exists (select 1 from public.buildings b where b.id = building_id));

drop policy if exists "building_images_manage_owner_admin" on public.building_images;
create policy "building_images_manage_owner_admin" on public.building_images
for all using (
  public.is_admin()
  or exists (select 1 from public.buildings b where b.id = building_id and b.landlord_id = auth.uid())
)
with check (
  public.is_admin()
  or exists (select 1 from public.buildings b where b.id = building_id and b.landlord_id = auth.uid())
);

drop policy if exists "room_images_select" on public.room_images;
create policy "room_images_select" on public.room_images
for select using (exists (select 1 from public.rooms r where r.id = room_id));

drop policy if exists "room_images_manage_owner_admin" on public.room_images;
create policy "room_images_manage_owner_admin" on public.room_images
for all using (
  public.is_admin()
  or exists (
    select 1 from public.rooms r join public.buildings b on b.id = r.building_id
    where r.id = room_images.room_id and b.landlord_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.rooms r join public.buildings b on b.id = r.building_id
    where r.id = room_images.room_id and b.landlord_id = auth.uid()
  )
);

-- LANDLORD-BROKER PERMISSIONS
drop policy if exists "lbp_select" on public.landlord_broker_permissions;
create policy "lbp_select" on public.landlord_broker_permissions
for select using (public.is_admin() or landlord_id = auth.uid() or broker_id = auth.uid());

drop policy if exists "lbp_insert" on public.landlord_broker_permissions;
create policy "lbp_insert" on public.landlord_broker_permissions
for insert with check (public.is_admin() or landlord_id = auth.uid() or broker_id = auth.uid());

drop policy if exists "lbp_update" on public.landlord_broker_permissions;
create policy "lbp_update" on public.landlord_broker_permissions
for update using (public.is_admin() or landlord_id = auth.uid())
with check (public.is_admin() or landlord_id = auth.uid());

-- BROKER ROOM ACTIONS
drop policy if exists "broker_actions_select" on public.broker_room_actions;
create policy "broker_actions_select" on public.broker_room_actions
for select using (public.is_admin() or broker_id = auth.uid());

drop policy if exists "broker_actions_insert" on public.broker_room_actions;
create policy "broker_actions_insert" on public.broker_room_actions
for insert with check (broker_id = auth.uid() and public.current_role() = 'broker');

drop policy if exists "broker_actions_update" on public.broker_room_actions;
create policy "broker_actions_update" on public.broker_room_actions
for update using (broker_id = auth.uid() or public.is_admin())
with check (broker_id = auth.uid() or public.is_admin());

drop policy if exists "broker_actions_delete" on public.broker_room_actions;
create policy "broker_actions_delete" on public.broker_room_actions
for delete using (broker_id = auth.uid() or public.is_admin());

-- STATUS LOGS
drop policy if exists "room_status_logs_select" on public.room_status_logs;
create policy "room_status_logs_select" on public.room_status_logs
for select using (
  public.is_admin()
  or exists (
    select 1 from public.rooms r join public.buildings b on b.id = r.building_id
    where r.id = room_status_logs.room_id
      and (b.landlord_id = auth.uid() or public.can_broker_view_landlord(b.landlord_id))
  )
);

-- REPORTS
drop policy if exists "room_reports_select" on public.room_reports;
create policy "room_reports_select" on public.room_reports
for select using (
  public.is_admin()
  or broker_id = auth.uid()
  or exists (
    select 1 from public.rooms r join public.buildings b on b.id = r.building_id
    where r.id = room_reports.room_id and b.landlord_id = auth.uid()
  )
);

drop policy if exists "room_reports_insert_broker" on public.room_reports;
create policy "room_reports_insert_broker" on public.room_reports
for insert with check (broker_id = auth.uid() and public.current_role() = 'broker');

drop policy if exists "room_reports_update_admin" on public.room_reports;
create policy "room_reports_update_admin" on public.room_reports
for update using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- 10. STORAGE BUCKET + STORAGE POLICIES
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'room-images',
  'room-images',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Suggested object path convention:
-- room-images/buildings/{building_id}/{filename}
-- room-images/rooms/{room_id}/{filename}

alter table storage.objects enable row level security;

drop policy if exists "room_images_storage_select_authenticated" on storage.objects;
create policy "room_images_storage_select_authenticated" on storage.objects
for select to authenticated
using (bucket_id = 'room-images');

drop policy if exists "room_images_storage_insert_owner_admin" on storage.objects;
create policy "room_images_storage_insert_owner_admin" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'room-images'
  and (
    public.is_admin()
    or public.current_role() = 'landlord'
  )
);

drop policy if exists "room_images_storage_update_owner_admin" on storage.objects;
create policy "room_images_storage_update_owner_admin" on storage.objects
for update to authenticated
using (bucket_id = 'room-images' and (public.is_admin() or public.current_role() = 'landlord'))
with check (bucket_id = 'room-images' and (public.is_admin() or public.current_role() = 'landlord'));

drop policy if exists "room_images_storage_delete_owner_admin" on storage.objects;
create policy "room_images_storage_delete_owner_admin" on storage.objects
for delete to authenticated
using (bucket_id = 'room-images' and (public.is_admin() or public.current_role() = 'landlord'));

-- =========================================================
-- 11. REALTIME PUBLICATION
-- =========================================================
-- Supabase may already have publication supabase_realtime.
-- These commands are safe if tables are not already added.
do $$
begin
  begin alter publication supabase_realtime add table public.rooms; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.buildings; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.room_status_logs; exception when duplicate_object then null; end;
end $$;

commit;
