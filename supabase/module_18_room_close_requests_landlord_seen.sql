-- Module 18 additive: landlord notification state for broker close-room requests.
-- Safe to run after module_06_broker_room_close_requests.sql.

begin;

alter table public.room_close_requests
  add column if not exists landlord_seen_at timestamptz;

create index if not exists idx_room_close_requests_landlord_unseen
  on public.room_close_requests(landlord_id, created_at desc)
  where status = 'pending' and landlord_seen_at is null;

create or replace function public.mark_room_close_request_seen(close_request_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.room_close_requests
  set
    landlord_seen_at = now(),
    updated_at = now()
  where id = close_request_id
    and landlord_id = auth.uid()
    and public.current_role() = 'landlord'
    and public.is_active_user()
    and status = 'pending'
    and landlord_seen_at is null
    and exists (
      select 1
      from public.rooms r
      join public.buildings b on b.id = r.building_id
      where r.id = room_close_requests.room_id
        and b.landlord_id = auth.uid()
    );
$$;

revoke all on function public.mark_room_close_request_seen(uuid) from public;
grant execute on function public.mark_room_close_request_seen(uuid) to authenticated;

commit;
