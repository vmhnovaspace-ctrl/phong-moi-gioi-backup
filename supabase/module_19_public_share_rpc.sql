-- Module 19 - Public share RPCs for /l, /b, and /r.
-- These functions let anonymous public share pages read only explicitly public
-- inventory fields without granting broad select access on source tables.

begin;

create or replace function public.public_share_room_payload(room_row public.rooms)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'id', room_row.id,
    'building_id', room_row.building_id,
    'room_code', room_row.room_code,
    'title', room_row.title,
    'floor', room_row.floor,
    'area_m2', room_row.area_m2,
    'rent_price', room_row.rent_price,
    'deposit_amount', room_row.deposit_amount,
    'max_people', room_row.max_people,
    'status', room_row.status,
    'available_from', room_row.available_from,
    'commission', room_row.commission,
    'min_lease_months', room_row.min_lease_months,
    'fee_mode', room_row.fee_mode,
    'room_layouts', room_row.room_layouts,
    'description', room_row.description,
    'strengths', room_row.strengths,
    'weaknesses', room_row.weaknesses,
    'room_drive_folder_url', room_row.room_drive_folder_url,
    'cover_image_url', room_row.cover_image_url,
    'public_slug', room_row.public_slug,
    'visibility', room_row.visibility,
    'updated_at', room_row.updated_at,
    'room_fees', (
      select jsonb_build_object(
        'room_id', room_fee.room_id,
        'electricity_price', room_fee.electricity_price,
        'electricity_unit', room_fee.electricity_unit,
        'water_price', room_fee.water_price,
        'water_unit', room_fee.water_unit,
        'bicycle_parking_fee', room_fee.bicycle_parking_fee,
        'motorbike_parking_fee', room_fee.motorbike_parking_fee,
        'car_parking_fee', room_fee.car_parking_fee,
        'parking_fee', room_fee.parking_fee,
        'service_fee', room_fee.service_fee,
        'internet_fee', room_fee.internet_fee,
        'management_fee', room_fee.management_fee,
        'other_fees', room_fee.other_fees
      )
      from public.room_fees room_fee
      where room_fee.room_id = room_row.id
      limit 1
    ),
    'room_features', (
      select jsonb_build_object(
        'room_id', room_feature.room_id,
        'has_window', coalesce(room_feature.has_window, false),
        'has_balcony', coalesce(room_feature.has_balcony, false),
        'has_private_bathroom', coalesce(room_feature.has_private_bathroom, false),
        'has_private_kitchen', coalesce(room_feature.has_private_kitchen, false),
        'has_washing_machine', coalesce(room_feature.has_washing_machine, false),
        'has_elevator', coalesce(room_feature.has_elevator, false),
        'has_air_conditioner', coalesce(room_feature.has_air_conditioner, false),
        'has_fridge', coalesce(room_feature.has_fridge, false),
        'has_bed', coalesce(room_feature.has_bed, false),
        'has_wardrobe', coalesce(room_feature.has_wardrobe, false),
        'allows_pet', coalesce(room_feature.allows_pet, false),
        'is_furnished', coalesce(room_feature.is_furnished, false),
        'has_parking', coalesce(room_feature.has_parking, false),
        'has_security', coalesce(room_feature.has_security, false),
        'created_at', room_feature.created_at,
        'updated_at', room_feature.updated_at
      )
      from public.room_features room_feature
      where room_feature.room_id = room_row.id
      limit 1
    ),
    'room_images', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', room_image.id,
            'image_url', room_image.image_url,
            'storage_path', room_image.storage_path,
            'source_type', room_image.source_type,
            'image_type', room_image.image_type,
            'sort_order', room_image.sort_order,
            'is_cover', room_image.is_cover,
            'created_at', room_image.created_at
          )
          order by room_image.is_cover desc, room_image.sort_order asc
        )
        from public.room_images room_image
        where room_image.room_id = room_row.id
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.public_share_building_payload(
  building_row public.buildings,
  include_rooms boolean default true
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'id', building_row.id,
    'landlord_id', building_row.landlord_id,
    'name', building_row.name,
    'address', building_row.address,
    'ward', building_row.ward,
    'district', building_row.district,
    'city', building_row.city,
    'description', building_row.description,
    'common_amenities', building_row.common_amenities,
    'house_rules', building_row.house_rules,
    'building_drive_folder_url', building_row.building_drive_folder_url,
    'cover_image_url', building_row.cover_image_url,
    'public_slug', building_row.public_slug,
    'visibility', building_row.visibility,
    'updated_at', building_row.updated_at,
    'building_fees', (
      select jsonb_build_object(
        'building_id', building_fee.building_id,
        'electricity_price', building_fee.electricity_price,
        'electricity_unit', building_fee.electricity_unit,
        'water_price', building_fee.water_price,
        'water_unit', building_fee.water_unit,
        'bicycle_parking_fee', building_fee.bicycle_parking_fee,
        'motorbike_parking_fee', building_fee.motorbike_parking_fee,
        'car_parking_fee', building_fee.car_parking_fee,
        'service_fee', building_fee.service_fee,
        'internet_fee', building_fee.internet_fee,
        'management_fee', building_fee.management_fee,
        'other_fees', building_fee.other_fees
      )
      from public.building_fees building_fee
      where building_fee.building_id = building_row.id
      limit 1
    ),
    'building_images', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', building_image.id,
            'image_url', building_image.image_url,
            'storage_path', building_image.storage_path,
            'source_type', building_image.source_type,
            'image_type', building_image.image_type,
            'sort_order', building_image.sort_order,
            'is_cover', building_image.is_cover,
            'created_at', building_image.created_at
          )
          order by building_image.is_cover desc, building_image.sort_order asc
        )
        from public.building_images building_image
        where building_image.building_id = building_row.id
      ),
      '[]'::jsonb
    ),
    'rooms', case
      when include_rooms then coalesce(
        (
          select jsonb_agg(
            public.public_share_room_payload(room_row)
            order by room_row.updated_at desc
          )
          from public.rooms room_row
          where room_row.building_id = building_row.id
            and room_row.visibility = 'visible'
            and room_row.status in ('available', 'coming_soon')
        ),
        '[]'::jsonb
      )
      else '[]'::jsonb
    end
  );
$$;

create or replace function public.get_public_landlord_share(landlord_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with landlord_row as (
    select profile.id, profile.full_name, profile.public_slug
    from public.profiles profile
    where profile.public_slug = trim(landlord_slug)
      and profile.role = 'landlord'
      and profile.status = 'active'
    limit 1
  )
  select case
    when not exists (select 1 from landlord_row) then null
    else jsonb_build_object(
      'landlord', (
        select jsonb_build_object(
          'id', landlord_row.id,
          'full_name', landlord_row.full_name,
          'public_slug', landlord_row.public_slug
        )
        from landlord_row
      ),
      'buildings', coalesce(
        (
          select jsonb_agg(
            public.public_share_building_payload(building_row, true)
            order by building_row.updated_at desc
          )
          from public.buildings building_row
          join landlord_row on landlord_row.id = building_row.landlord_id
          where building_row.visibility = 'visible'
        ),
        '[]'::jsonb
      )
    )
  end;
$$;

create or replace function public.get_public_building_share(building_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with public_building as (
    select
      building_row,
      building_row.landlord_id,
      profile.full_name as landlord_name,
      profile.public_slug as landlord_slug
    from public.buildings building_row
    join public.profiles profile on profile.id = building_row.landlord_id
    where building_row.public_slug = trim(building_slug)
      and building_row.visibility = 'visible'
      and profile.role = 'landlord'
      and profile.status = 'active'
    limit 1
  )
  select case
    when not exists (select 1 from public_building) then null
    else jsonb_build_object(
      'landlord', (
        select jsonb_build_object(
          'id', public_building.landlord_id,
          'full_name', public_building.landlord_name,
          'public_slug', public_building.landlord_slug
        )
        from public_building
      ),
      'building', (
        select public.public_share_building_payload(public_building.building_row, true)
        from public_building
      )
    )
  end;
$$;

create or replace function public.get_public_room_share(room_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with public_room as (
    select
      room_row,
      building_row,
      profile.id as landlord_id,
      profile.full_name as landlord_name,
      profile.public_slug as landlord_slug
    from public.rooms room_row
    join public.buildings building_row on building_row.id = room_row.building_id
    join public.profiles profile on profile.id = building_row.landlord_id
    where room_row.public_slug = trim(room_slug)
      and room_row.visibility = 'visible'
      and room_row.status in ('available', 'coming_soon')
      and building_row.visibility = 'visible'
      and profile.role = 'landlord'
      and profile.status = 'active'
    limit 1
  )
  select case
    when exists (select 1 from public_room) then jsonb_build_object(
      'unavailable', false,
      'landlord', (
        select jsonb_build_object(
          'id', public_room.landlord_id,
          'full_name', public_room.landlord_name,
          'public_slug', public_room.landlord_slug
        )
        from public_room
      ),
      'building', (
        select public.public_share_building_payload(public_room.building_row, false)
        from public_room
      ),
      'room', (
        select public.public_share_room_payload(public_room.room_row)
        from public_room
      )
    )
    when exists (
      select 1
      from public.rooms room_row
      where room_row.public_slug = trim(room_slug)
    ) then jsonb_build_object('unavailable', true)
    else null
  end;
$$;

revoke all on function public.public_share_room_payload(public.rooms) from public;
revoke all on function public.public_share_building_payload(public.buildings, boolean) from public;

revoke all on function public.get_public_landlord_share(text) from public;
revoke all on function public.get_public_building_share(text) from public;
revoke all on function public.get_public_room_share(text) from public;

grant execute on function public.get_public_landlord_share(text) to anon, authenticated;
grant execute on function public.get_public_building_share(text) to anon, authenticated;
grant execute on function public.get_public_room_share(text) to anon, authenticated;

commit;
