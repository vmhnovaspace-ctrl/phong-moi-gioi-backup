alter table public.rooms
  add column if not exists room_layouts text[];

with layout_aliases(raw_value, layout_key, sort_order) as (
  values
    ('studio', 'studio', 1),
    ('Studio', 'studio', 1),
    ('one_bedroom', 'one_bedroom', 2),
    ('01 phòng ngủ', 'one_bedroom', 2),
    ('1 phòng ngủ', 'one_bedroom', 2),
    ('two_bedroom', 'two_bedroom', 3),
    ('02 phòng ngủ', 'two_bedroom', 3),
    ('2 phòng ngủ', 'two_bedroom', 3),
    ('three_bedroom', 'three_bedroom', 4),
    ('03 phòng ngủ', 'three_bedroom', 4),
    ('3 phòng ngủ', 'three_bedroom', 4),
    ('balcony', 'balcony', 5),
    ('Có ban công', 'balcony', 5),
    ('ban công', 'balcony', 5),
    ('window', 'window', 6),
    ('Có cửa sổ', 'window', 6),
    ('cửa sổ', 'window', 6),
    ('loft', 'loft', 7),
    ('Có gác', 'loft', 7),
    ('duplex', 'duplex', 8),
    ('Duplex / thông tầng', 'duplex', 8),
    ('penthouse', 'penthouse', 9),
    ('Penthouse / áp mái', 'penthouse', 9),
    ('corner_room', 'corner_room', 10),
    ('Phòng góc', 'corner_room', 10),
    ('nice_view', 'nice_view', 11),
    ('Phòng view đẹp', 'nice_view', 11),
    ('low_floor', 'low_floor', 12),
    ('Phòng tầng thấp', 'low_floor', 12),
    ('high_floor', 'high_floor', 13),
    ('Phòng tầng cao', 'high_floor', 13),
    ('drying_yard', 'drying_yard', 14),
    ('Có sân phơi', 'drying_yard', 14),
    ('loggia', 'loggia', 15),
    ('Có logia', 'loggia', 15),
    ('private_kitchen', 'private_kitchen', 16),
    ('Có bếp riêng', 'private_kitchen', 16),
    ('bếp riêng', 'private_kitchen', 16),
    ('private_bathroom', 'private_bathroom', 17),
    ('Có WC riêng', 'private_bathroom', 17),
    ('wc riêng', 'private_bathroom', 17),
    ('nhà vệ sinh riêng', 'private_bathroom', 17)
),
stored_layout_candidates as (
  select
    rooms.id,
    aliases.layout_key,
    aliases.sort_order
  from public.rooms as rooms
  left join lateral unnest(coalesce(rooms.room_layouts, '{}'::text[])) as stored_layout(raw_value) on true
  join layout_aliases as aliases
    on lower(trim(stored_layout.raw_value)) = lower(aliases.raw_value)
),
legacy_layout_candidates as (
  select room_features.room_id as id, 'balcony'::text as layout_key, 5 as sort_order
  from public.room_features
  where coalesce(room_features.has_balcony, false)

  union all

  select room_features.room_id as id, 'window'::text as layout_key, 6 as sort_order
  from public.room_features
  where coalesce(room_features.has_window, false)

  union all

  select room_features.room_id as id, 'private_kitchen'::text as layout_key, 16 as sort_order
  from public.room_features
  where coalesce(room_features.has_private_kitchen, false)

  union all

  select room_features.room_id as id, 'private_bathroom'::text as layout_key, 17 as sort_order
  from public.room_features
  where coalesce(room_features.has_private_bathroom, false)
),
normalized_candidates as (
  select id, layout_key, min(sort_order) as sort_order
  from (
    select * from stored_layout_candidates
    union all
    select * from legacy_layout_candidates
  ) as combined
  group by id, layout_key
),
normalized_room_layouts as (
  select
    rooms.id,
    coalesce(
      array_agg(normalized_candidates.layout_key order by normalized_candidates.sort_order)
        filter (where normalized_candidates.layout_key is not null),
      '{}'::text[]
    ) as room_layouts
  from public.rooms as rooms
  left join normalized_candidates
    on normalized_candidates.id = rooms.id
  group by rooms.id
)
update public.rooms as rooms
set room_layouts = normalized_room_layouts.room_layouts
from normalized_room_layouts
where rooms.id = normalized_room_layouts.id
  and rooms.room_layouts is distinct from normalized_room_layouts.room_layouts;

alter table public.rooms
  alter column room_layouts set default '{}'::text[],
  alter column room_layouts set not null;

create index if not exists rooms_room_layouts_gin_idx
  on public.rooms using gin (room_layouts);
