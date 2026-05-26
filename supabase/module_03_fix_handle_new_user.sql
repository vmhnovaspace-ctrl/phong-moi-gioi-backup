-- Module 03 fix: make auth.users -> public.profiles sync safe.
-- Run in Supabase SQL Editor if register shows: Database error saving new user.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_role text;
  safe_role public.user_role;
  safe_full_name text;
  safe_slug text;
begin
  metadata_role := lower(trim(coalesce(new.raw_user_meta_data->>'role', '')));

  safe_role := case
    when metadata_role in ('admin', 'landlord', 'broker')
      then metadata_role::public.user_role
    else 'broker'::public.user_role
  end;

  safe_full_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  safe_slug := 'u-' || replace(new.id::text, '-', '');

  insert into public.profiles (id, full_name, email, role, status, public_slug)
  values (
    new.id,
    coalesce(safe_full_name, split_part(new.email, '@', 1), 'New user'),
    new.email,
    safe_role,
    'pending'::public.user_status,
    safe_slug
  )
  on conflict (id) do update set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    email = coalesce(public.profiles.email, excluded.email),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill any auth user that exists without a profile.
insert into public.profiles (id, full_name, email, role, status, public_slug)
select
  u.id,
  coalesce(nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', '')), ''), split_part(u.email, '@', 1), 'New user'),
  u.email,
  case
    when lower(trim(coalesce(u.raw_user_meta_data->>'role', ''))) in ('admin', 'landlord', 'broker')
      then lower(trim(u.raw_user_meta_data->>'role'))::public.user_role
    else 'broker'::public.user_role
  end,
  'pending'::public.user_status,
  'u-' || replace(u.id::text, '-', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
