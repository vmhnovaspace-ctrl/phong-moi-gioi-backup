-- Module 10 workflow fix - Customer interest events from public room packages.
-- Run this after customer room packages have been applied.

begin;

create table if not exists public.customer_room_package_events (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.customer_room_packages(id) on delete cascade,
  package_public_slug text not null,
  room_id uuid not null references public.rooms(id) on delete cascade,
  broker_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text,
  customer_phone text,
  customer_zalo_link text,
  customer_need text,
  room_code text,
  room_name text,
  house_address text,
  action_type text not null default 'customer_interested_room'
    check (action_type in ('customer_interested_room')),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (package_id, room_id, action_type)
);

drop trigger if exists trg_customer_room_package_events_updated_at
  on public.customer_room_package_events;
create trigger trg_customer_room_package_events_updated_at
before update on public.customer_room_package_events
for each row execute function public.set_updated_at();

create index if not exists idx_customer_package_events_broker_read_created
  on public.customer_room_package_events(broker_id, is_read, created_at desc);
create index if not exists idx_customer_package_events_package
  on public.customer_room_package_events(package_id, created_at desc);
create index if not exists idx_customer_package_events_room
  on public.customer_room_package_events(room_id, created_at desc);

alter table public.customer_room_package_events enable row level security;

drop policy if exists "customer_package_events_select_owner_admin"
  on public.customer_room_package_events;
create policy "customer_package_events_select_owner_admin"
on public.customer_room_package_events
for select using (public.is_admin() or broker_id = auth.uid());

drop policy if exists "customer_package_events_update_owner_admin"
  on public.customer_room_package_events;
create policy "customer_package_events_update_owner_admin"
on public.customer_room_package_events
for update using (public.is_admin() or broker_id = auth.uid())
with check (public.is_admin() or broker_id = auth.uid());

drop policy if exists "customer_package_events_delete_admin"
  on public.customer_room_package_events;
create policy "customer_package_events_delete_admin"
on public.customer_room_package_events
for delete using (public.is_admin());

create or replace function public.record_customer_room_package_interest(
  package_slug text,
  selected_room_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_row record;
  inserted_row public.customer_room_package_events%rowtype;
  created_event boolean := false;
begin
  select
    p.id as package_id,
    p.public_slug,
    p.broker_id,
    p.customer_name,
    p.customer_phone,
    p.customer_zalo_link,
    p.customer_need,
    r.id as room_id,
    r.room_code,
    r.title as room_name,
    concat_ws(
      ', ',
      nullif(b.name, ''),
      public.sanitize_address_for_tenant(b.address),
      nullif(b.ward, ''),
      nullif(b.district, ''),
      nullif(b.city, '')
    ) as house_address
  into source_row
  from public.customer_room_packages p
  join public.customer_room_package_items i
    on i.package_id = p.id
  join public.rooms r
    on r.id = i.room_id
  join public.buildings b
    on b.id = r.building_id
  where p.public_slug = package_slug
    and p.status = 'active'
    and (p.expires_at is null or p.expires_at > now())
    and r.id = selected_room_id
    and r.visibility = 'visible'
    and b.visibility = 'visible'
    and r.status in ('available', 'coming_soon', 'reserved')
  limit 1;

  if source_row.package_id is null then
    return jsonb_build_object(
      'ok', false,
      'error', 'Khong tim thay phong trong goi gui khach nay.'
    );
  end if;

  insert into public.customer_room_package_events (
    package_id,
    package_public_slug,
    room_id,
    broker_id,
    customer_name,
    customer_phone,
    customer_zalo_link,
    customer_need,
    room_code,
    room_name,
    house_address,
    action_type
  )
  values (
    source_row.package_id,
    source_row.public_slug,
    source_row.room_id,
    source_row.broker_id,
    source_row.customer_name,
    source_row.customer_phone,
    source_row.customer_zalo_link,
    source_row.customer_need,
    source_row.room_code,
    source_row.room_name,
    source_row.house_address,
    'customer_interested_room'
  )
  on conflict (package_id, room_id, action_type) do nothing
  returning * into inserted_row;

  if inserted_row.id is not null then
    created_event := true;
  else
    select *
    into inserted_row
    from public.customer_room_package_events
    where package_id = source_row.package_id
      and room_id = source_row.room_id
      and action_type = 'customer_interested_room'
    limit 1;
  end if;

  return jsonb_build_object(
    'ok', true,
    'event_id', inserted_row.id,
    'created', created_event
  );
end;
$$;

grant execute on function public.record_customer_room_package_interest(text, uuid)
  to anon, authenticated;

commit;
