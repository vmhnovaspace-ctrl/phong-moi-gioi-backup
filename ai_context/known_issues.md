# Known Issues and Risks

Last updated: 2026-05-19.

## Migration State

- Module 04 local migration file is corrected and should use `drop view if exists public.v_broker_rooms;` followed by `create view public.v_broker_rooms as ...`.
- Supabase REST read checks returned HTTP 200 for `building_fees`, new `rooms` columns, new `room_fees` columns, and `v_broker_rooms`.
- Still recommended before production: verify trigger/RLS details directly in Supabase SQL Editor.

## Potential DB / RLS Risks

- `v_broker_rooms` is dropped and recreated. Check dependent views/functions before production use if the project grows.
- `building_fees` RLS needs manual landlord/admin/broker visibility tests.
- `room_fees.parking_fee` remains as legacy column; UI now prefers bicycle/motorbike/car fee fields.
- Module 05 broker browsing should not bypass RLS or duplicate landlord ownership logic.

## Potential App Issues

- Room upload stores `getPublicUrl()` output in `room_images.image_url`, but bucket is configured private in base schema. `getLandlordRoom()` creates signed URLs for uploaded images in landlord room detail; future broker/public views must also handle private uploaded images carefully.
- Sell list currently does not fetch room image records; it shows room data and copy content, not image previews.
- Room form appends new image links/uploads on every edit; it does not delete old image records, reorder images, or manage cover selection.
- Room form `building_default` path can upsert an empty `building_fees` row if landlord submits without fees. This is acceptable for MVP but should be monitored.
- Duplicate flow can create rooms without `room_features` rows if copy features is unchecked. Future UI should tolerate missing features rows.
- Duplicate flow copies uploaded image records by reference, not storage files. This matches MVP behavior but should be tested with storage policies.
- Quick edit server action throws errors; current UI does not provide inline row-level error feedback.
- Currency inputs in quick edit are compact text inputs. Server parsing strips non-digits, but browser-side live formatting is not implemented.

## UI / UX Remaining Work

- Landlord UI is usable and more compact after wrap-up, but not final design-system quality.
- Room quick edit table is optimized for scanning, but still needs visual QA with real data sets across mobile and desktop.
- Building detail page may need further hierarchy tuning after manual landlord testing.
- Image management UX is basic and should be improved in Module 05 or a dedicated image module.
- Empty states and success/error feedback can be improved later.

## Realtime / Notifications

- Supabase Realtime publication includes relevant tables from base/migration, but no polished realtime broker UI exists.
- There is no "new update available" broker banner yet.
- Room status changes are logged, but not surfaced as realtime notifications in current UI.
- Module 05/06 should decide whether realtime is required immediately or deferred.

## Tooling Issues

- `corepack pnpm lint` fails because `package.json` uses `next lint`, which is invalid in current Next 16 setup.
- `node_modules` previously had Windows/OneDrive permission/reparse issues; it was refreshed with pnpm.
- Because the workspace path contains Vietnamese characters and lives under OneDrive, prefer running Next directly with:

```powershell
node .\node_modules\next\dist\bin\next build --webpack
```

## Manual Testing Needed

- Active landlord can create/update building.
- Active landlord can create/update building fees.
- Landlord can create room using building fees.
- Landlord can create room with room override fees.
- Landlord can edit a room switching between fee modes.
- Quick status update writes `room_status_logs`.
- Quick price/deposit/available date update works.
- Duplicate room rejects duplicate room codes.
- Duplicate room copies fees/features/images when selected.
- Room upload inserts into Storage and `room_images`.
- Room detail renders signed uploaded images.
- Sell list includes only `available` and `coming_soon`.
- Broker/admin/pending/blocked route behavior still matches Module 03.

## Unknowns

- Whether all production/test Supabase instances have exactly the same Module 02/03/04 migrations applied.
- Whether storage bucket `room-images` is private or public in every live environment after manual changes.
- Whether any live data relies on legacy `room_fees.parking_fee`.
- Whether any production deployment is connected to this local repo.
