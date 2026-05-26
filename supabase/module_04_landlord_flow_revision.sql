-- Module 04 revision: landlord fees, lease term, quick landlord flow.
-- Run this after Module 02 and Module 03 migrations.

begin;

do $$ begin
  create type public.room_fee_mode as enum ('building_default', 'room_override');
exception when duplicate_object then null; end $$;

create table if not exists public.building_fees (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null unique references public.buildings(id) on delete cascade,
  electricity_price text,
  electricity_unit text not null default 'kWh',
  water_price text,
  water_unit text not null default 'm3',
  bicycle_parking_fee text,
  motorbike_parking_fee text,
  car_parking_fee text,
  service_fee text,
  internet_fee text,
  management_fee text,
  other_fees text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooms
  add column if not exists fee_mode public.room_fee_mode not null default 'building_default',
  add column if not exists min_lease_months integer check (min_lease_months is null or min_lease_months > 0);

alter table public.room_fees
  add column if not exists electricity_unit text not null default 'kWh',
  add column if not exists water_unit text not null default 'm3',
  add column if not exists bicycle_parking_fee text,
  add column if not exists motorbike_parking_fee text,
  add column if not exists car_parking_fee text;

update public.room_fees
set motorbike_parking_fee = coalesce(motorbike_parking_fee, parking_fee)
where parking_fee is not null
  and motorbike_parking_fee is null;

drop trigger if exists trg_building_fees_updated_at on public.building_fees;
create trigger trg_building_fees_updated_at
before update on public.building_fees
for each row execute function public.set_updated_at();

create index if not exists idx_building_fees_building on public.building_fees(building_id);
create index if not exists idx_rooms_fee_mode on public.rooms(fee_mode);
create index if not exists idx_rooms_min_lease_months on public.rooms(min_lease_months);

alter table public.building_fees enable row level security;

drop policy if exists "building_fees_select" on public.building_fees;
create policy "building_fees_select" on public.building_fees
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.buildings b
    where b.id = building_fees.building_id
      and (
        b.landlord_id = auth.uid()
        or (
          b.visibility = 'visible'
          and public.can_broker_view_landlord(b.landlord_id)
        )
      )
  )
);

drop policy if exists "building_fees_manage_owner_admin" on public.building_fees;
create policy "building_fees_manage_owner_admin" on public.building_fees
for all using (
  public.is_admin()
  or exists (
    select 1
    from public.buildings b
    where b.id = building_fees.building_id
      and b.landlord_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.buildings b
    where b.id = building_fees.building_id
      and b.landlord_id = auth.uid()
  )
);

drop view if exists public.v_broker_rooms;

create view public.v_broker_rooms as
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

do $$
begin
  begin alter publication supabase_realtime add table public.building_fees; exception when duplicate_object then null; end;
end $$;

commit;
