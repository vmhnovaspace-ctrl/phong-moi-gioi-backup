alter table public.rooms
  add column if not exists room_layouts text[];

with layout_aliases(normalized_value, label, sort_order) as (
  values
    ('studio', 'Studio', 1),
    ('01 phòng ngủ', '01 phòng ngủ', 2),
    ('1 phòng ngủ', '01 phòng ngủ', 2),
    ('02 phòng ngủ', '02 phòng ngủ', 3),
    ('2 phòng ngủ', '02 phòng ngủ', 3),
    ('03 phòng ngủ', '03 phòng ngủ', 4),
    ('3 phòng ngủ', '03 phòng ngủ', 4),
    ('có ban công', 'Có ban công', 5),
    ('ban công', 'Có ban công', 5),
    ('có cửa sổ', 'Có cửa sổ', 6),
    ('cửa sổ', 'Có cửa sổ', 6),
    ('có gác', 'Có gác', 7),
    ('duplex / thông tầng', 'Duplex / thông tầng', 8),
    ('penthouse / áp mái', 'Penthouse / áp mái', 9),
    ('phòng góc', 'Phòng góc', 10),
    ('phòng view đẹp', 'Phòng view đẹp', 11),
    ('phòng tầng thấp', 'Phòng tầng thấp', 12),
    ('phòng tầng cao', 'Phòng tầng cao', 13),
    ('có sân phơi', 'Có sân phơi', 14),
    ('có logia', 'Có logia', 15),
    ('có bếp riêng', 'Có bếp riêng', 16),
    ('bếp riêng', 'Có bếp riêng', 16),
    ('có wc riêng', 'Có WC riêng', 17),
    ('wc riêng', 'Có WC riêng', 17)
),
stored_layout_candidates as (
  select
    rooms.id,
    aliases.label,
    aliases.sort_order
  from public.rooms as rooms
  left join lateral unnest(coalesce(rooms.room_layouts, '{}'::text[])) as stored_layout(raw_value) on true
  join layout_aliases as aliases
    on lower(trim(stored_layout.raw_value)) = lower(aliases.normalized_value)
),
legacy_layout_candidates as (
  select room_features.room_id as id, 'Có ban công'::text as label, 5 as sort_order
  from public.room_features
  where coalesce(room_features.has_balcony, false)

  union all

  select room_features.room_id as id, 'Có cửa sổ'::text as label, 6 as sort_order
  from public.room_features
  where coalesce(room_features.has_window, false)

  union all

  select room_features.room_id as id, 'Có bếp riêng'::text as label, 16 as sort_order
  from public.room_features
  where coalesce(room_features.has_private_kitchen, false)

  union all

  select room_features.room_id as id, 'Có WC riêng'::text as label, 17 as sort_order
  from public.room_features
  where coalesce(room_features.has_private_bathroom, false)
),
normalized_candidates as (
  select distinct id, label, sort_order
  from (
    select * from stored_layout_candidates
    union all
    select * from legacy_layout_candidates
  ) as combined
),
normalized_room_layouts as (
  select
    rooms.id,
    case
      when count(normalized_candidates.label) = 0 then null
      else array_agg(normalized_candidates.label order by normalized_candidates.sort_order)
    end as room_layouts
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
