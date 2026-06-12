alter table public.rooms
  add column if not exists room_layouts text[];

update public.rooms
set room_layouts = array_remove(
  array[
    case when room_features.has_balcony then 'Có ban công' end,
    case when room_features.has_window then 'Có cửa sổ' end,
    case when room_features.has_private_kitchen then 'Có bếp riêng' end,
    case when room_features.has_private_bathroom then 'Có WC riêng' end
  ],
  null
)
from public.room_features
where room_features.room_id = rooms.id
  and (
    rooms.room_layouts is null
    or cardinality(rooms.room_layouts) = 0
  );
