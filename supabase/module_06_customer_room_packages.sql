-- Module 06 - Customer room packages for broker manual Zalo sharing.
-- Run this after Module 02/03/04/05 migrations.

begin;

create table if not exists public.customer_room_packages (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text,
  customer_phone text,
  customer_zalo_link text,
  customer_need text not null,
  title text not null,
  public_slug text not null unique default public.generate_slug('pkg'),
  status text not null default 'active' check (status in ('active', 'hidden')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_room_package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.customer_room_packages(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (package_id, room_id)
);

drop trigger if exists trg_customer_room_packages_updated_at on public.customer_room_packages;
create trigger trg_customer_room_packages_updated_at
before update on public.customer_room_packages
for each row execute function public.set_updated_at();

create index if not exists idx_customer_packages_broker_created
  on public.customer_room_packages(broker_id, created_at desc);
create index if not exists idx_customer_packages_public_slug
  on public.customer_room_packages(public_slug);
create index if not exists idx_customer_package_items_package_sort
  on public.customer_room_package_items(package_id, sort_order);
create index if not exists idx_customer_package_items_room
  on public.customer_room_package_items(room_id);

alter table public.customer_room_packages enable row level security;
alter table public.customer_room_package_items enable row level security;

drop policy if exists "customer_packages_select_owner_admin" on public.customer_room_packages;
create policy "customer_packages_select_owner_admin" on public.customer_room_packages
for select using (public.is_admin() or broker_id = auth.uid());

drop policy if exists "customer_packages_insert_broker" on public.customer_room_packages;
create policy "customer_packages_insert_broker" on public.customer_room_packages
for insert with check (
  broker_id = auth.uid()
  and public.current_role() = 'broker'
  and public.is_active_user()
);

drop policy if exists "customer_packages_update_owner_admin" on public.customer_room_packages;
create policy "customer_packages_update_owner_admin" on public.customer_room_packages
for update using (public.is_admin() or broker_id = auth.uid())
with check (public.is_admin() or broker_id = auth.uid());

drop policy if exists "customer_packages_delete_owner_admin" on public.customer_room_packages;
create policy "customer_packages_delete_owner_admin" on public.customer_room_packages
for delete using (public.is_admin() or broker_id = auth.uid());

drop policy if exists "customer_package_items_select_owner_admin" on public.customer_room_package_items;
create policy "customer_package_items_select_owner_admin" on public.customer_room_package_items
for select using (
  public.is_admin()
  or exists (
    select 1 from public.customer_room_packages p
    where p.id = customer_room_package_items.package_id
      and p.broker_id = auth.uid()
  )
);

drop policy if exists "customer_package_items_insert_owner_admin" on public.customer_room_package_items;
create policy "customer_package_items_insert_owner_admin" on public.customer_room_package_items
for insert with check (
  public.is_admin()
  or (
    exists (
      select 1 from public.customer_room_packages p
      where p.id = customer_room_package_items.package_id
        and p.broker_id = auth.uid()
        and public.current_role() = 'broker'
    )
    and exists (
      select 1
      from public.rooms r
      join public.buildings b on b.id = r.building_id
      where r.id = customer_room_package_items.room_id
        and r.visibility = 'visible'
        and b.visibility = 'visible'
        and r.status in ('available', 'coming_soon', 'reserved')
        and public.can_broker_view_landlord(b.landlord_id)
    )
  )
);

drop policy if exists "customer_package_items_update_owner_admin" on public.customer_room_package_items;
create policy "customer_package_items_update_owner_admin" on public.customer_room_package_items
for update using (
  public.is_admin()
  or exists (
    select 1 from public.customer_room_packages p
    where p.id = customer_room_package_items.package_id
      and p.broker_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or (
    exists (
      select 1 from public.customer_room_packages p
      where p.id = customer_room_package_items.package_id
        and p.broker_id = auth.uid()
    )
    and exists (
      select 1
      from public.rooms r
      join public.buildings b on b.id = r.building_id
      where r.id = customer_room_package_items.room_id
        and r.visibility = 'visible'
        and b.visibility = 'visible'
        and r.status in ('available', 'coming_soon', 'reserved')
        and public.can_broker_view_landlord(b.landlord_id)
    )
  )
);

drop policy if exists "customer_package_items_delete_owner_admin" on public.customer_room_package_items;
create policy "customer_package_items_delete_owner_admin" on public.customer_room_package_items
for delete using (
  public.is_admin()
  or exists (
    select 1 from public.customer_room_packages p
    where p.id = customer_room_package_items.package_id
      and p.broker_id = auth.uid()
  )
);

create or replace function public.sanitize_address_for_tenant(input_address text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(
      regexp_replace(
        coalesce(input_address, ''),
        '^\s*\d+[[:alpha:]]?(?:/\d+[[:alpha:]]?)*(?:[\s,.\-]+|$)',
        '',
        'i'
      )
    ),
    ''
  );
$$;

create or replace function public.get_customer_room_package_public(package_slug text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with package_row as (
    select p.*
    from public.customer_room_packages p
    where p.public_slug = package_slug
      and p.status = 'active'
      and (p.expires_at is null or p.expires_at > now())
    limit 1
  ),
  rooms_for_package as (
    select
      i.sort_order,
      r.id,
      r.title,
      r.area_m2,
      r.rent_price,
      r.deposit_amount,
      r.max_people,
      r.description,
      r.strengths,
      r.room_drive_folder_url,
      r.cover_image_url,
      public.sanitize_address_for_tenant(b.address) as safe_address,
      b.ward,
      b.district,
      b.city,
      b.building_drive_folder_url,
      rf.has_window,
      rf.has_balcony,
      rf.has_private_bathroom,
      rf.has_private_kitchen,
      rf.has_washing_machine,
      rf.has_elevator,
      rf.has_air_conditioner,
      rf.has_fridge,
      rf.has_bed,
      rf.has_wardrobe,
      rf.allows_pet,
      rf.is_furnished,
      rf.has_parking,
      rf.has_security
    from package_row p
    join public.customer_room_package_items i on i.package_id = p.id
    join public.rooms r on r.id = i.room_id
    join public.buildings b on b.id = r.building_id
    left join public.room_features rf on rf.room_id = r.id
    where r.visibility = 'visible'
      and b.visibility = 'visible'
      and r.status in ('available', 'coming_soon', 'reserved')
  )
  select case
    when not exists (select 1 from package_row) then null
    else jsonb_build_object(
      'id', (select id from package_row),
      'customer_name', (select customer_name from package_row),
      'customer_need', (select customer_need from package_row),
      'title', (select title from package_row),
      'public_slug', (select public_slug from package_row),
      'created_at', (select created_at from package_row),
      'rooms', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', rfp.id,
              'title', rfp.title,
              'area_m2', rfp.area_m2,
              'rent_price', rfp.rent_price,
              'deposit_amount', rfp.deposit_amount,
              'max_people', rfp.max_people,
              'description', rfp.description,
              'strengths', rfp.strengths,
              'room_drive_folder_url', rfp.room_drive_folder_url,
              'cover_image_url', rfp.cover_image_url,
              'building_drive_folder_url', rfp.building_drive_folder_url,
              'location', concat_ws(', ', rfp.safe_address, rfp.ward, rfp.district, rfp.city),
              'features', jsonb_build_object(
                'has_window', coalesce(rfp.has_window, false),
                'has_balcony', coalesce(rfp.has_balcony, false),
                'has_private_bathroom', coalesce(rfp.has_private_bathroom, false),
                'has_private_kitchen', coalesce(rfp.has_private_kitchen, false),
                'has_washing_machine', coalesce(rfp.has_washing_machine, false),
                'has_elevator', coalesce(rfp.has_elevator, false),
                'has_air_conditioner', coalesce(rfp.has_air_conditioner, false),
                'has_fridge', coalesce(rfp.has_fridge, false),
                'has_bed', coalesce(rfp.has_bed, false),
                'has_wardrobe', coalesce(rfp.has_wardrobe, false),
                'allows_pet', coalesce(rfp.allows_pet, false),
                'is_furnished', coalesce(rfp.is_furnished, false),
                'has_parking', coalesce(rfp.has_parking, false),
                'has_security', coalesce(rfp.has_security, false)
              ),
              'images', coalesce(
                (
                  select jsonb_agg(
                    jsonb_build_object(
                      'id', ri.id,
                      'image_url', ri.image_url,
                      'storage_path', ri.storage_path,
                      'source_type', ri.source_type,
                      'image_type', ri.image_type,
                      'is_cover', ri.is_cover,
                      'sort_order', ri.sort_order
                    )
                    order by ri.is_cover desc, ri.sort_order asc
                  )
                  from public.room_images ri
                  where ri.room_id = rfp.id
                ),
                '[]'::jsonb
              )
            )
            order by rfp.sort_order asc
          )
          from rooms_for_package rfp
        ),
        '[]'::jsonb
      )
    )
  end;
$$;

grant execute on function public.get_customer_room_package_public(text) to anon, authenticated;

drop policy if exists "customer_package_storage_select_public_active" on storage.objects;
create policy "customer_package_storage_select_public_active" on storage.objects
for select to anon
using (
  bucket_id = 'room-images'
  and exists (
    select 1
    from public.room_images ri
    join public.customer_room_package_items i on i.room_id = ri.room_id
    join public.customer_room_packages p on p.id = i.package_id
    where ri.storage_path = storage.objects.name
      and p.status = 'active'
      and (p.expires_at is null or p.expires_at > now())
  )
);

commit;
