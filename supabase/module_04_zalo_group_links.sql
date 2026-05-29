-- Module 04 additive: landlord Zalo group links and sell workflow tracking.

begin;

alter table public.profiles
  add column if not exists landlord_zalo_group_url text,
  add column if not exists landlord_zalo_group_name text;

alter table public.buildings
  add column if not exists zalo_group_url text,
  add column if not exists zalo_group_name text;

create table if not exists public.room_sell_events (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  building_id uuid references public.buildings(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  event_type text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint room_sell_events_event_type_check check (
    event_type in ('share_landlord', 'share_building', 'share_room', 'closed_announcement')
  )
);

create index if not exists idx_room_sell_events_landlord_created
  on public.room_sell_events(landlord_id, created_at desc);

create index if not exists idx_room_sell_events_room_created
  on public.room_sell_events(room_id, created_at desc)
  where room_id is not null;

create index if not exists idx_room_sell_events_building_created
  on public.room_sell_events(building_id, created_at desc)
  where building_id is not null;

alter table public.room_sell_events enable row level security;

drop policy if exists "room_sell_events_select_owner_admin" on public.room_sell_events;
create policy "room_sell_events_select_owner_admin"
on public.room_sell_events
for select
using (
  public.is_admin()
  or landlord_id = auth.uid()
);

drop policy if exists "room_sell_events_insert_owner" on public.room_sell_events;
create policy "room_sell_events_insert_owner"
on public.room_sell_events
for insert
with check (
  landlord_id = auth.uid()
  and created_by = auth.uid()
  and public.current_role() = 'landlord'
  and public.is_active_user()
  and (
    building_id is null
    or exists (
      select 1
      from public.buildings b
      where b.id = room_sell_events.building_id
        and b.landlord_id = auth.uid()
    )
  )
  and (
    room_id is null
    or exists (
      select 1
      from public.rooms r
      join public.buildings b on b.id = r.building_id
      where r.id = room_sell_events.room_id
        and b.landlord_id = auth.uid()
        and (
          room_sell_events.building_id is null
          or room_sell_events.building_id = r.building_id
        )
    )
  )
);

do $$
begin
  begin
    alter publication supabase_realtime add table public.room_sell_events;
  exception when duplicate_object then
    null;
  end;
end $$;

commit;
