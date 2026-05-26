# Module 05 Preparation

Last updated: 2026-05-19.

## Purpose

Module 05 should build on the landlord inventory from Module 04 instead of duplicating it.

The next module should make landlord room data usable for broker-facing inventory browsing and/or image workflows, depending on product direction. Current preparation assumes broker inventory browsing is the main next step.

## Data Broker Will Use

Broker browsing should reuse:

- `profiles` for landlord/broker identity.
- `buildings` for address, district, ward, city, visibility, Drive folder URL.
- `rooms` for room code, floor, area, price, deposit, status, available date, commission, lease term, description, visibility.
- `building_fees` for shared building fees.
- `room_fees` for room override fees.
- `room_features` for amenities.
- `room_images` for linked/uploaded room images.
- `landlord_broker_permissions` for access control.
- `broker_room_actions` for broker private saved/posted/sent/customer state.
- `room_reports` for broker reports.
- `room_status_logs` for history if needed.

## What Broker Should See

Default broker inventory should show:

- only active broker access
- visible buildings
- visible rooms
- rooms with status:
  - `available`
  - `coming_soon`
- building name and address area
- room code/floor/area
- rent price and deposit
- available date
- commission
- minimum lease term
- effective fees:
  - building fees when `fee_mode = building_default`
  - room fees when `fee_mode = room_override`
- features
- Drive folder URL if present
- safe image URLs/previews when supported

Broker may later see `reserved` if product decides brokers can track held rooms, but default browse should focus on sellable inventory.

## What Broker Should Not See

Broker should not see:

- rooms from landlords without approved access, unless product later changes to public marketplace mode.
- hidden buildings.
- hidden rooms.
- rented rooms by default.
- landlord-only internal edit controls.
- other brokers' private notes/actions.
- arbitrary profiles beyond what is needed for inventory context.
- internal/virtual email values.

Broker should not mutate:

- `buildings`
- `rooms`
- `building_fees`
- `room_fees`
- `room_features`
- `room_images`

Broker-specific writes should go to:

- `broker_room_actions`
- `room_reports`

## API / View / Table Reuse

Prefer reusing or extending:

- `v_broker_rooms` for initial broker-visible room list.
- RLS helper `can_broker_view_landlord()`.
- status labels and formatting helpers from `lib/landlord/format.ts` if still appropriate.
- room/building TypeScript types from `lib/landlord/types.ts` as a base, or move shared inventory types into a neutral `lib/inventory` namespace if needed.
- `room_images` signed URL pattern from `getLandlordRoom()`.
- building/room visibility rules from Module 04.

Do not duplicate:

- fee mode logic
- effective fee calculation
- room status label mappings
- image source type handling
- landlord ownership checks
- visibility filtering

## Suggested Broker Inventory Architecture

Recommended structure:

```text
lib/inventory/
  types.ts
  format.ts
  effective-fees.ts

lib/broker/
  queries.ts
  actions.ts

components/broker/
  broker-room-card.tsx
  broker-filter-bar.tsx
  broker-room-list.tsx
  broker-room-detail.tsx
  broker-room-actions-form.tsx
```

Routes can stay under:

```text
app/broker
app/broker/rooms/[id]
app/broker/saved
app/broker/actions
```

Data flow:

1. `app/broker/layout.tsx` requires active broker profile.
2. Broker dashboard calls a broker query that uses RLS-safe tables/views.
3. Query returns visible rooms with building, effective fees, features, images, and broker's private action state if needed.
4. UI filters by landlord/building/district/price/status/features/commission.
5. Broker actions update only `broker_room_actions`.
6. Reports insert into `room_reports`.

## Inventory Browsing Proposal

First broker page should prioritize:

- searchable/filterable room list
- grouping by building
- room status badges
- price/deposit/area
- availability date
- commission
- image/Drive affordance
- save room action
- copy content action
- private note/action state

Start with server-rendered data and URL query filters. Add realtime later if needed.

## Image Handling For Broker

Broker image views must account for:

- `room_drive_folder_url` as a direct external link.
- `room_images.source_type = google_drive_link` or `external_url` as external links/previews where safe.
- `room_images.source_type = uploaded` requiring signed URLs when Storage is private.

Avoid assuming `room_images.image_url` is public for uploaded images.

## Permissions Checklist

Before building broker UI, verify:

- active broker can query allowed visible rooms.
- broker cannot query unapproved landlord rooms.
- broker cannot update landlord room/building tables.
- broker can create/update only own `broker_room_actions`.
- broker can insert own `room_reports`.
- admin visibility still works.

## Avoid In Module 05

- Do not rewrite Module 04 landlord flow.
- Do not add Zalo API.
- Do not add Google Drive Picker unless the module is explicitly scoped as image system.
- Do not weaken RLS to make broker UI work.
- Do not copy landlord server actions for broker writes.
- Do not store broker private notes on rooms.
- Do not expose hidden/rented data by accident.

## Open Decisions

- Whether Module 05 is broker dashboard or image system. Existing PRD order names Module 05 as Image System and Module 06 as Broker Dashboard, but current handover asks broker preparation. Confirm next module scope before implementation.
- Whether broker access is permission-gated by landlord approval or open to all active brokers.
- Whether broker can see `reserved` rooms.
- Whether uploaded images should be displayed as thumbnails in broker list or only in detail.
- Whether realtime update banner is part of Module 05 or deferred.
