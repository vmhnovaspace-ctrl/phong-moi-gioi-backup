alter table public.room_close_requests
  add column if not exists broker_acknowledged_at timestamptz;

drop policy if exists "rooms_broker_closed_select" on public.rooms;
create policy "rooms_broker_closed_select"
on public.rooms
for select
using (
  public.current_role() = 'broker'
  and public.is_active_user()
  and visibility = 'visible'
  and exists (
    select 1
    from public.room_close_requests cr
    join public.buildings b on b.id = rooms.building_id
    where cr.room_id = rooms.id
      and cr.broker_id = auth.uid()
      and cr.status = 'approved'
      and b.visibility = 'visible'
      and public.can_broker_view_landlord(b.landlord_id)
  )
);

create or replace function public.acknowledge_room_close_request(close_request_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.room_close_requests
  set
    broker_acknowledged_at = now(),
    updated_at = now()
  where id = close_request_id
    and broker_id = auth.uid()
    and public.current_role() = 'broker'
    and public.is_active_user()
    and status in ('approved', 'rejected')
    and broker_acknowledged_at is null;
$$;

create or replace function public.cancel_room_close_request(room_uuid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.room_close_requests
  set
    resolved_at = now(),
    status = 'cancelled',
    updated_at = now()
  where room_id = room_uuid
    and broker_id = auth.uid()
    and public.current_role() = 'broker'
    and public.is_active_user()
    and status = 'pending';
$$;

revoke all on function public.acknowledge_room_close_request(uuid) from public;
revoke all on function public.cancel_room_close_request(uuid) from public;
grant execute on function public.acknowledge_room_close_request(uuid) to authenticated;
grant execute on function public.cancel_room_close_request(uuid) to authenticated;
