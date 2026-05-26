# Business Rules

Last updated: 2026-05-19.

## Auth and Users

- Users register with full name, phone number, password, and public role choice (`landlord` or `broker`).
- Login is by phone number + password.
- Phone numbers are normalized to Vietnam `+84` format.
- New users are usually `pending` until approved.
- Pending users go to `/pending`.
- Blocked users go to `/blocked`.
- OTP/reset password flow exists in Module 03.
- Profiles contain `full_name`, `phone`, `email`, `role`, `status`.
- UI should display `profiles.phone` / `profiles.full_name`, not internal email.

## Roles

- `landlord`: manages only their own buildings, rooms, fees, features, and images.
- `broker`: may view broker-visible inventory when permission rules allow; full broker dashboard is not implemented in Module 04.
- `admin`: can manage system-level data where implemented and where RLS allows.
- Route access must follow role and status.
- Landlord client input must never supply arbitrary `landlord_id`; owner identity comes from session/profile.

## Building and Room Model

- One building is one concrete address.
- One landlord can own many buildings.
- One building can contain many rooms.
- A room must belong to exactly one building.
- No standalone room outside a building.
- Room codes must be unique within one building.

## Room Status

Current room statuses:

- `available`: sellable now.
- `coming_soon`: sellable soon.
- `reserved`: held/deposit in progress.
- `rented`: not sellable by default.
- `hidden`: temporarily hidden.

Status rules:

- Landlord can update room status through room edit or quick edit.
- Status changes update `rooms.status`.
- `room_status_logs` trigger records status history.
- App code should not manually insert status logs unless the trigger is intentionally removed or bypassed.
- Sell lists default to `available` and `coming_soon`.

## Visibility

- Business visibility uses `visibility = visible | hidden`.
- Do not hard delete landlord inventory unless explicitly requested.
- A hidden room/building should not appear in broker-visible inventory.
- Landlord can still manage their own data through owner-scoped routes.
- Public share link behavior is planned later and is not completed in Module 04.

## Shared Fees

- Fees are usually shared at building level.
- `building_fees` stores common fees for one building.
- There should be at most one `building_fees` row per building.
- Shared fee fields:
  - electricity price and unit
  - water price and unit
  - bicycle parking fee
  - motorbike parking fee
  - car parking fee
  - service fee
  - internet fee
  - management fee
  - other fees
- Landlord manages shared fees only for their own building.

## Room Override Fees

- `rooms.fee_mode = building_default` means use `building_fees`.
- `rooms.fee_mode = room_override` means use `room_fees`.
- `room_fees` is retained as room-specific override fees.
- When a room switches from override to building default, room-specific fee row can be deleted.
- Old `room_fees.parking_fee` may still exist for migration/backward compatibility, but UI should prefer bicycle/motorbike/car fields.

## Lease Term

- `rooms.min_lease_months` stores minimum lease term in months.
- It may be null.
- If provided, it must be greater than 0.

## Duplicate Room

- Landlord can duplicate one source room into multiple new room codes.
- New room codes must not duplicate existing `room_code` in the same building.
- New rooms must get fresh IDs and slugs via database defaults.
- Do not copy `room_status_logs`.
- Copy options may include price, deposit, area, description, fees, features, and images.
- If copy images is selected:
  - copy `room_drive_folder_url`
  - copy `room_images` records to new room IDs
  - uploaded files are referenced, not physically duplicated
- If source room uses building fees, copies can use building fees.
- If source room uses room override fees and copy fees is selected, create override fee rows for copied rooms.

## Sell List

- Landlord sell list includes only rooms with:
  - `available`
  - `coming_soon`
- It excludes by default:
  - `reserved`
  - `rented`
  - `hidden`
- Sell list is grouped by building.
- Sell list supports simple copy text.
- Zalo button is placeholder only. No Zalo API integration.

## Broker Visibility Rules

Broker inventory should follow these rules in Module 05/06:

- Broker sees rooms only when their account is active and allowed by RLS/policies.
- Building must be `visible`.
- Room must be `visible`.
- Default broker inventory should focus on `available` and `coming_soon`.
- Access to landlord inventory should depend on approved `landlord_broker_permissions` unless product direction explicitly changes to public inventory.
- Brokers should not mutate landlord-owned room/building data.
- Broker private actions/notes belong in `broker_room_actions`, not landlord tables.
- Broker reports belong in `room_reports`.

## Room Image Requirements

MVP image inputs:

- Landlord can paste room Drive folder URL into `rooms.room_drive_folder_url`.
- Landlord can paste individual image links into `room_images`.
- Landlord can upload images to Supabase Storage bucket `room-images`.
- `room_images.source_type` must be one of:
  - `uploaded`
  - `google_drive_link`
  - `external_url`
- Uploaded images should store `storage_path`.
- Private uploaded images should be served with signed URLs when displayed.
- Room image data must not be deleted just because a table/list chooses not to show image columns.
- Google Drive Picker, cover management, reorder, delete, and watermarking are future improvements.

## Explicitly Out of Scope

- No Zalo API.
- No Zalo Mini App.
- No automatic Chotot/Mogi/Facebook posting.
- No Google Drive Picker in Module 04.
- No advanced watermark/gallery/image system unless specifically requested.
- No broker dashboard implementation inside Module 04.
