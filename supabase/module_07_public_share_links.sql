-- Module 07 - Public share links for /l, /b, and /r.
-- Allows anonymous read access only to active-landlord, visible, sellable inventory
-- needed by public share pages. Write access remains unchanged.

begin;

drop policy if exists "profiles_public_share_landlords_select" on public.profiles;
create policy "profiles_public_share_landlords_select" on public.profiles
for select to anon using (
  role = 'landlord'
  and status = 'active'
  and exists (
    select 1
    from public.buildings b
    join public.rooms r on r.building_id = b.id
    where b.landlord_id = profiles.id
      and b.visibility = 'visible'
      and r.visibility = 'visible'
      and r.status in ('available', 'coming_soon')
  )
);

drop policy if exists "buildings_public_share_select" on public.buildings;
create policy "buildings_public_share_select" on public.buildings
for select to anon using (
  visibility = 'visible'
  and exists (
    select 1
    from public.profiles p
    where p.id = buildings.landlord_id
      and p.role = 'landlord'
      and p.status = 'active'
  )
);

drop policy if exists "rooms_public_share_select" on public.rooms;
create policy "rooms_public_share_select" on public.rooms
for select to anon using (
  visibility = 'visible'
  and status in ('available', 'coming_soon')
  and exists (
    select 1
    from public.buildings b
    join public.profiles p on p.id = b.landlord_id
    where b.id = rooms.building_id
      and b.visibility = 'visible'
      and p.role = 'landlord'
      and p.status = 'active'
  )
);

drop policy if exists "building_fees_public_share_select" on public.building_fees;
create policy "building_fees_public_share_select" on public.building_fees
for select to anon using (
  exists (
    select 1
    from public.buildings b
    join public.profiles p on p.id = b.landlord_id
    where b.id = building_fees.building_id
      and b.visibility = 'visible'
      and p.role = 'landlord'
      and p.status = 'active'
  )
);

drop policy if exists "storage_public_share_images_select" on storage.objects;
create policy "storage_public_share_images_select" on storage.objects
for select to anon using (
  bucket_id = 'room-images'
  and (
    exists (
      select 1
      from public.room_images ri
      join public.rooms r on r.id = ri.room_id
      join public.buildings b on b.id = r.building_id
      join public.profiles p on p.id = b.landlord_id
      where ri.storage_path = storage.objects.name
        and r.visibility = 'visible'
        and r.status in ('available', 'coming_soon')
        and b.visibility = 'visible'
        and p.role = 'landlord'
        and p.status = 'active'
    )
    or exists (
      select 1
      from public.building_images bi
      join public.buildings b on b.id = bi.building_id
      join public.profiles p on p.id = b.landlord_id
      where bi.storage_path = storage.objects.name
        and b.visibility = 'visible'
        and p.role = 'landlord'
        and p.status = 'active'
    )
  )
);

commit;
