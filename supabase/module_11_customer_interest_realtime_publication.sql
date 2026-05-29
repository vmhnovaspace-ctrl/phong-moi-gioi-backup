-- Module 11 additive: publish customer interest events to Supabase Realtime.
-- Run after supabase/module_10_customer_interest_events.sql.

begin;

do $$
begin
  if to_regclass('public.customer_room_package_events') is not null then
    begin
      alter publication supabase_realtime add table public.customer_room_package_events;
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end if;
end $$;

commit;
