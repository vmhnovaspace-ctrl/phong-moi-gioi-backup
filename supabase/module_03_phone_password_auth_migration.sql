-- Module 03: Phone + password auth migration.
-- Run this in Supabase SQL Editor before testing the new auth UI.

begin;

-- Phone becomes the business identity. Email can remain for legacy/internal rows.
alter table public.profiles
  alter column email drop not null;

create unique index if not exists profiles_phone_unique
  on public.profiles(phone)
  where phone is not null;

create index if not exists idx_profiles_phone
  on public.profiles(phone);

-- Safe auth.users -> public.profiles sync for phone/password auth.
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
  safe_phone text;
  safe_slug text;
begin
  metadata_role := lower(trim(coalesce(new.raw_user_meta_data->>'role', '')));

  safe_role := case
    when metadata_role in ('admin', 'landlord', 'broker')
      then metadata_role::public.user_role
    else 'broker'::public.user_role
  end;

  safe_full_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  safe_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', new.phone, '')), '');
  safe_slug := 'u-' || replace(new.id::text, '-', '');

  insert into public.profiles (id, full_name, phone, email, role, status, public_slug)
  values (
    new.id,
    coalesce(safe_full_name, split_part(coalesce(new.email, safe_phone), '@', 1), 'New user'),
    safe_phone,
    new.email,
    safe_role,
    'pending'::public.user_status,
    safe_slug
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    email = excluded.email,
    role = excluded.role,
    status = coalesce(public.profiles.status, 'pending'::public.user_status),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill any auth user that exists without a profile.
insert into public.profiles (id, full_name, phone, email, role, status, public_slug)
select
  u.id,
  coalesce(
    nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', '')), ''),
    split_part(coalesce(u.email, u.phone), '@', 1),
    'New user'
  ),
  nullif(trim(coalesce(u.raw_user_meta_data->>'phone', u.phone, '')), ''),
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

-- Server-side existence check for forgot password. The API should still return
-- careful messages to avoid unnecessary phone enumeration in production.
create or replace function public.profile_exists_by_phone(target_phone text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.phone = target_phone
  );
$$;

revoke all on function public.profile_exists_by_phone(text) from public;
grant execute on function public.profile_exists_by_phone(text) to anon, authenticated;

commit;
