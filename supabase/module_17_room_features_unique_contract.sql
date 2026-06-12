with ranked_room_features as (
  select
    id,
    row_number() over (
      partition by room_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as row_number
  from public.room_features
)
delete from public.room_features as room_features
using ranked_room_features
where room_features.id = ranked_room_features.id
  and ranked_room_features.row_number > 1;

alter table public.room_features
  alter column has_window set default false,
  alter column has_balcony set default false,
  alter column has_private_bathroom set default false,
  alter column has_private_kitchen set default false,
  alter column has_washing_machine set default false,
  alter column has_elevator set default false,
  alter column has_air_conditioner set default false,
  alter column has_fridge set default false,
  alter column has_bed set default false,
  alter column has_wardrobe set default false,
  alter column allows_pet set default false,
  alter column is_furnished set default false,
  alter column has_parking set default false,
  alter column has_security set default false;

create unique index if not exists room_features_room_id_unique_idx
  on public.room_features (room_id);
