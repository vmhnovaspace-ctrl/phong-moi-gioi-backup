# System Architecture

Last updated: 2026-05-19.

## Frontend

- Next.js App Router.
- React server components for pages/layouts.
- Client components for forms and small interactions using `useActionState`.
- Tailwind CSS for styling.
- Main app folders:
  - `app/(auth)/*`: login/register/forgot/reset/change password flows.
  - `app/landlord/*`: landlord dashboard, buildings, rooms, duplicate, sell list.
  - `app/broker/*`: Module 03 broker stubs.
  - `app/admin/*`: Module 03 admin stubs.

## Backend / Supabase Access

- Server actions live mainly in `app/landlord/actions.ts` for Module 04.
- Landlord read queries live in `lib/landlord/queries.ts`.
- Landlord types live in `lib/landlord/types.ts`.
- Supabase server client is created in `lib/supabase/server.ts`.
- Route/session refresh middleware is in `lib/supabase/middleware.ts` and `proxy.ts`.
- Profile helpers are in `lib/auth/profile.ts`.

## Auth Architecture

- Phone/password based auth from Module 03.
- Profile role/status controls routing.
- `requireAuthProfile()` handles login/pending/blocked redirects.
- `requireRole([...])` guards role-specific layouts/routes.
- `app/landlord/layout.tsx` requires `landlord`.
- Module 04 server actions re-check landlord ownership before mutating buildings, rooms, fees, features, or images.

## Database

Base schema from Module 02:

- `profiles`
- `buildings`
- `rooms`
- `room_fees`
- `room_features`
- `building_images`
- `room_images`
- `landlord_broker_permissions`
- `broker_room_actions`
- `room_status_logs`
- `room_reports`

Module 04 revision adds:

- `building_fees`
- `rooms.fee_mode`
- `rooms.min_lease_months`
- extra `room_fees` fields for units and separated bicycle/motorbike/car parking fees

## Landlord Inventory Flow

Landlord inventory is built around:

```text
profile(role=landlord) -> buildings -> rooms
```

Runtime flow:

1. Landlord accesses `/landlord`.
2. Layout requires active landlord profile.
3. Dashboard reads building summaries via `getLandlordDashboard()`.
4. Building detail reads one landlord-owned building with rooms, room image counts, and building fees via `getLandlordBuildingDetail()`.
5. Room detail reads room, building, building fees, room fees, features, and images via `getLandlordRoom()`.

## Building -> Room Structure

- A building is one concrete address and belongs to exactly one landlord.
- A room belongs to exactly one building.
- There are no standalone rooms.
- Landlord queries always scope by `buildings.landlord_id = profile.id`.
- Room mutations call `requireOwnedRoom()` or `requireOwnedBuilding()`.

## Shared Fee Architecture

- `building_fees` stores common fees for a building.
- `rooms.fee_mode = building_default` means the room uses `building_fees`.
- `rooms.fee_mode = room_override` means the room uses `room_fees`.
- `getLandlordRoom()` returns:
  - `building_fees`
  - `fees`
  - `effective_fees`
- Building fee UI is a compact summary with a collapsible edit form.

## Sell List Architecture

- Landlord sell list routes:
  - `/landlord/sell-list`
  - `/landlord/buildings/[id]/sell-list`
- Data source is `getLandlordSellList(landlordId, buildingId?)`.
- Query includes only rooms with status:
  - `available`
  - `coming_soon`
- Rooms are grouped by building in `SellListView`.
- Sell list currently supports simple copy text.
- No Zalo API integration exists.

## Visibility Architecture

- Business records use `visibility = visible | hidden`.
- Landlord pages can access their own visible/hidden data through owner-scoped queries and RLS.
- Broker visibility is prepared by DB rules:
  - building and room must be `visible`
  - room status must be broker-sellable where applicable
  - broker access depends on `landlord_broker_permissions.status = approved`
  - helper function `can_broker_view_landlord()` is used in policies/views
- Public share link routes are planned for a later module and not implemented yet.

## Room Image Architecture

Module 04 supports image capture, but not a full gallery system.

Supported room image sources:

- `room_drive_folder_url` on `rooms`
- individual image links inserted into `room_images`
- uploaded files inserted into Supabase Storage bucket `room-images` and recorded in `room_images`

Important details:

- Uploaded records use `source_type = uploaded`.
- Link records use `source_type = google_drive_link` or `external_url`.
- `room_images.storage_path` is used for uploaded files.
- `getLandlordRoom()` creates signed URLs for uploaded images before rendering room detail.
- Sell list does not fetch room image records in Module 04.
- Cover picker, deletion, reorder, watermarking, and Google Drive Picker are not implemented.

## Quick Edit Architecture

- `RoomQuickList` renders the building detail room table.
- Each row is a small form associated with inputs by `form={formId}`.
- Submit calls `quickUpdateRoomAction`.
- The action:
  - requires landlord role
  - checks room ownership
  - validates status
  - parses money inputs by stripping non-digits
  - updates `rooms.status`, `rooms.rent_price`, `rooms.deposit_amount`, `rooms.available_from`
  - revalidates landlord paths
- Status logging is handled by database trigger `trg_rooms_status_log`.

## Routing Structure

Landlord routes:

- `/landlord`
- `/landlord/buildings`
- `/landlord/buildings/new`
- `/landlord/buildings/[id]`
- `/landlord/buildings/[id]/edit`
- `/landlord/buildings/[id]/rooms/new`
- `/landlord/buildings/[id]/sell-list`
- `/landlord/rooms/[id]`
- `/landlord/rooms/[id]/edit`
- `/landlord/rooms/[id]/duplicate`
- `/landlord/sell-list`

## Main Data Flow

1. Landlord logs in with active landlord profile.
2. Landlord creates building.
3. Landlord sets building-level fees.
4. Landlord creates rooms under a building.
5. Room either uses building fees (`building_default`) or room-specific override fees (`room_override`).
6. Landlord can quick-edit status/price/deposit/available date from building detail.
7. Landlord sell list shows `available` and `coming_soon` rooms grouped by building.
8. Broker browsing should reuse visible rooms/buildings, room images, effective fee logic, and permission rules in Module 05/06.

## Module Boundaries

- Module 04 owns landlord inventory management.
- Module 05 should prepare/extend image and broker-consumable inventory browsing without rewriting landlord flows.
- Broker dashboard is not implemented in Module 04.
- Zalo API, Google Drive Picker, auto posting, and advanced gallery features are out of scope unless explicitly requested.
