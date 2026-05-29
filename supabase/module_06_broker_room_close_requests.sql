-- Module 06 additive: close-room requests from brokers for landlord approval.
-- Safe to run after Module 02/03/04/05/06. Re-runnable for local Supabase SQL Editor use.

begin;

create table if not exists public.room_close_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  broker_id uuid not null references public.profiles(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  broker_note text,
  landlord_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id)
);

alter table public.room_close_requests
  add column if not exists broker_note text,
  add column if not exists landlord_note text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references public.profiles(id);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'room_close_requests'
      and column_name = 'note'
  ) then
    update public.room_close_requests
    set broker_note = coalesce(broker_note, note)
    where broker_note is null
      and note is not null;
  end if;
end $$;

update public.room_close_requests
set status = 'approved'
where status = 'confirmed';

alter table public.room_close_requests
  drop constraint if exists room_close_requests_status_check;

alter table public.room_close_requests
  add constraint room_close_requests_status_check
  check (status in ('pending', 'approved', 'rejected', 'cancelled'));

drop trigger if exists trg_room_close_requests_updated_at
  on public.room_close_requests;
create trigger trg_room_close_requests_updated_at
before update on public.room_close_requests
for each row execute function public.set_updated_at();

create index if not exists idx_room_close_requests_room
  on public.room_close_requests(room_id);

create index if not exists idx_room_close_requests_broker
  on public.room_close_requests(broker_id);

create index if not exists idx_room_close_requests_landlord
  on public.room_close_requests(landlord_id);

create index if not exists idx_room_close_requests_status
  on public.room_close_requests(status);

create index if not exists idx_room_close_requests_created
  on public.room_close_requests(created_at desc);

create unique index if not exists uq_room_close_requests_pending_room_broker
  on public.room_close_requests(room_id, broker_id)
  where status = 'pending';

alter table public.room_close_requests enable row level security;

drop policy if exists "room_close_requests_select" on public.room_close_requests;
create policy "room_close_requests_select"
on public.room_close_requests
for select
using (
  public.is_admin()
  or broker_id = auth.uid()
  or exists (
    select 1
    from public.rooms r
    join public.buildings b on b.id = r.building_id
    where r.id = room_close_requests.room_id
      and b.landlord_id = auth.uid()
  )
);

drop policy if exists "room_close_requests_insert_broker" on public.room_close_requests;
create policy "room_close_requests_insert_broker"
on public.room_close_requests
for insert
with check (
  broker_id = auth.uid()
  and public.current_role() = 'broker'
  and public.is_active_user()
  and status = 'pending'
  and resolved_at is null
  and resolved_by is null
  and exists (
    select 1
    from public.rooms r
    join public.buildings b on b.id = r.building_id
    where r.id = room_close_requests.room_id
      and b.landlord_id = room_close_requests.landlord_id
      and b.visibility = 'visible'
      and r.visibility = 'visible'
      and r.status in ('available', 'coming_soon')
      and public.can_broker_view_landlord(b.landlord_id)
  )
);

drop policy if exists "room_close_requests_update_landlord" on public.room_close_requests;
create policy "room_close_requests_update_landlord"
on public.room_close_requests
for update
using (
  public.is_admin()
  or (
    status = 'pending'
    and public.current_role() = 'landlord'
    and public.is_active_user()
    and exists (
      select 1
      from public.rooms r
      join public.buildings b on b.id = r.building_id
      where r.id = room_close_requests.room_id
        and b.landlord_id = auth.uid()
    )
  )
)
with check (
  public.is_admin()
  or (
    landlord_id = auth.uid()
    and status in ('approved', 'rejected', 'cancelled')
    and resolved_by = auth.uid()
    and resolved_at is not null
    and exists (
      select 1
      from public.rooms r
      join public.buildings b on b.id = r.building_id
      where r.id = room_close_requests.room_id
        and b.landlord_id = auth.uid()
    )
  )
);

do $$
begin
  begin
    alter publication supabase_realtime add table public.room_close_requests;
  exception when duplicate_object then
    null;
  end;
end $$;

commit;
