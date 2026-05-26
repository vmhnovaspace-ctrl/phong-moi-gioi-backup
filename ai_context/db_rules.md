# Database Rules

Last updated: 2026-05-19.

## Main Tables

Core tables from Module 02:

- `profiles`: users, role, status, phone/email/name.
- `buildings`: landlord-owned buildings/addresses.
- `rooms`: rooms belonging to buildings.
- `room_fees`: originally room fees; after Module 04 revision, room fee override.
- `room_features`: room amenities/features.
- `building_images`: building image records.
- `room_images`: room image/link/upload records.
- `landlord_broker_permissions`: broker access to landlord data.
- `broker_room_actions`: broker private actions/notes.
- `room_status_logs`: status change history.
- `room_reports`: broker reports.

Module 04 revision adds:

- `building_fees`: common fees for one building.
- `rooms.fee_mode`: fee mode enum, `building_default` or `room_override`.
- `rooms.min_lease_months`: minimum lease term.
- `room_fees.electricity_unit`.
- `room_fees.water_unit`.
- `room_fees.bicycle_parking_fee`.
- `room_fees.motorbike_parking_fee`.
- `room_fees.car_parking_fee`.

## Important Columns

`profiles`:

- `id`
- `full_name`
- `phone`
- `email`
- `role`
- `status`
- `public_slug`

`buildings`:

- `id`
- `landlord_id`
- `name`
- `address`
- `ward`
- `district`
- `city`
- `visibility`
- `public_slug`
- `building_drive_folder_url`

`rooms`:

- `id`
- `building_id`
- `room_code`
- `floor`
- `area_m2`
- `rent_price`
- `deposit_amount`
- `status`
- `available_from`
- `commission`
- `min_lease_months`
- `fee_mode`
- `room_drive_folder_url`
- `visibility`
- `public_slug`

`building_fees`:

- `id`
- `building_id` unique
- `electricity_price`
- `electricity_unit`
- `water_price`
- `water_unit`
- `bicycle_parking_fee`
- `motorbike_parking_fee`
- `car_parking_fee`
- `service_fee`
- `internet_fee`
- `management_fee`
- `other_fees`
- `created_at`
- `updated_at`

`room_fees`:

- `room_id` unique
- same fee fields as building fees after Module 04 revision
- legacy `parking_fee` may still exist

## Enums

Module 04 adds:

- `room_fee_mode`: `building_default`, `room_override`

Existing important enums:

- `room_status`: `available`, `coming_soon`, `reserved`, `rented`, `hidden`
- `visibility_status`: `visible`, `hidden`
- `image_source_type`: `uploaded`, `google_drive_link`, `external_url`

## Views

- `v_building_room_counts`: building room count summary.
- `v_broker_rooms`: broker-visible room view.

Module 04 migration drops and recreates `v_broker_rooms` because adding columns to `rooms` made `create or replace view` with `r.*` unsafe.

Use this pattern:

```sql
drop view if exists public.v_broker_rooms;
create view public.v_broker_rooms as ...
```

Do not use `create or replace view` for this view when `r.*` column order may change.

## RLS and Policies

Important rules:

- `profiles`: user sees self, admin sees all, active users can see active profiles.
- `buildings`: landlord sees own buildings; admin sees all; broker access depends on `can_broker_view_landlord`.
- `rooms`: landlord/admin manage rooms via owning building; broker visibility limited by building/room visibility/status and permissions.
- `room_fees`: inherits room/building ownership checks.
- `room_features`: inherits room/building ownership checks.
- `room_images`: inherits room/building ownership checks.
- `building_images`: inherits building ownership checks.
- `building_fees`: inherits building ownership checks.
- `room_status_logs`: selectable by admin, owning landlord, or allowed broker.

Module 04 `building_fees` policies:

- select allowed for admin, owning landlord, or allowed broker when building visibility/permission allow it.
- manage allowed for admin or owning landlord.
- RLS must remain enabled.

## Room Status Rules

- Status changes must update `rooms.status`.
- DB trigger `trg_rooms_status_log` writes `room_status_logs`.
- Do not manually insert status logs from app code.
- Quick edit updates `rooms.status`, `rooms.rent_price`, `rooms.deposit_amount`, `rooms.available_from`.
- `room_status_logs.changed_by` uses `auth.uid()` from the DB trigger.

## Building Fee Rules

- One `building_fees` row per building.
- `building_fees.building_id` is unique.
- Landlord can upsert fees only for owned building.
- `trg_building_fees_updated_at` updates `updated_at`.
- Rooms with `fee_mode = building_default` should use `building_fees`.
- Rooms with `fee_mode = room_override` should use `room_fees`.

## Room Image Rules

- `room_images` stores metadata for uploaded and linked images.
- Uploaded images should include `storage_path`.
- Private Storage images should be rendered using signed URLs.
- Do not remove `room_images` data when changing list/table UI.
- Storage bucket: `room-images`.

## Migration Files in Repo

Module 03:

- `supabase/module_03_fix_handle_new_user.sql`
- `supabase/module_03_phone_password_auth_migration.sql`
- `supabase/module_03_verify_and_repair_profile_sync.sql`

Module 04:

- `supabase/module_04_landlord_flow_revision.sql`

Module 02 base schema is referenced from Downloads:

- `C:\Users\PC\Downloads\module_02_supabase_schema.sql`

## Naming Conventions

- Tables: lowercase snake_case plural where existing schema does so.
- Enums: lowercase snake_case, e.g. `room_fee_mode`.
- Policies: descriptive quoted policy names.
- Triggers: `trg_<table>_<purpose>`.
- Indexes: `idx_<table>_<columns/purpose>`.
- Public slugs are generated by database defaults.

## Schema Change Rules

- Prefer additive migrations for already-applied schema.
- Do not edit old migrations that may have run in production/test Supabase.
- Keep data migration safe.
- Do not drop legacy columns without explicit confirmation.
- Preserve `room_status_logs` trigger behavior.
- Do not weaken RLS to make UI work.
- Do not trust client-provided ownership fields.

## Supabase Checks After Module 04 Migration

Verify:

```sql
select * from public.building_fees limit 1;
select fee_mode, min_lease_months from public.rooms limit 1;
select electricity_unit, water_unit, bicycle_parking_fee, motorbike_parking_fee, car_parking_fee from public.room_fees limit 1;
select * from public.v_broker_rooms limit 1;
```

Also verify:

- `building_fees` RLS is enabled.
- `trg_building_fees_updated_at` exists.
- `v_broker_rooms` was dropped and recreated.
- Supabase Storage bucket `room-images` exists.
