# Current Status

Last updated: 2026-05-19.

## Module 01 - PRD / Product Context

Status: captured in repo context.

External reference files:

- `C:\Users\PC\Downloads\PROJECT_CONTEXT.md`
- `C:\Users\PC\Downloads\PRD_MVP_V1.md`

These define the MVP goal: structured room inventory for landlords and brokers, using the core data model:

```text
Landlord -> Building/address -> Room
```

## Module 02 - Supabase Schema

Status: base schema exists and later migrations build on it.

Known file:

- `C:\Users\PC\Downloads\module_02_supabase_schema.sql`

It defines core tables, enums, RLS, indexes, storage bucket, triggers, and views.

## Module 03 - Auth & Role Permission

Status: implemented and treated as stable.

Implemented behavior:

- Phone/password login/register.
- Phone normalization to Vietnam `+84`.
- Profile sync with Supabase Auth.
- `profiles` contains `full_name`, `phone`, `email`, `role`, `status`.
- Route guards redirect by status/role.
- Pending users go to `/pending`.
- Blocked users go to `/blocked`.
- Forgot/reset password OTP flow exists.
- Change password exists.

Do not casually change Module 03 auth architecture while working on Module 04/05.

## Module 04 - Landlord Flow

Status: feature-complete for MVP landlord inventory flow, with remaining manual QA needed.

Completed:

- Landlord dashboard with inventory metrics.
- Building list/create/detail/edit.
- Room create/detail/edit.
- Building-level shared fees via `building_fees`.
- Room-level fee mode:
  - `building_default`
  - `room_override`
- Minimum lease term via `rooms.min_lease_months`.
- Room image inputs:
  - Drive folder URL
  - individual image links
  - direct upload to Supabase Storage
- Room image records saved in `room_images`.
- Room detail shows effective fees and signed URLs for uploaded private Storage images.
- Compact building detail inventory table.
- Quick edit for room status, price, deposit, available date.
- Duplicate room flow.
- Landlord sell list for all buildings.
- Building-specific sell list.
- Simple copy content button in sell list.
- Disabled `Gửi Zalo sau` placeholder.
- UI wrap-up:
  - dashboard actions grouped
  - top nav no longer duplicates sell list
  - building fees moved below room list and collapsed behind a summary
  - room quick edit table redesigned as compact SaaS-style table with horizontal scroll

## Module 04 Routes

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

## Module 04 Components

- `components/landlord/building-card.tsx`
- `components/landlord/building-fees-form.tsx`
- `components/landlord/building-form.tsx`
- `components/landlord/copy-room-button.tsx`
- `components/landlord/duplicate-room-form.tsx`
- `components/landlord/empty-state.tsx`
- `components/landlord/price-display.tsx`
- `components/landlord/room-card.tsx`
- `components/landlord/room-form.tsx`
- `components/landlord/room-quick-list.tsx`
- `components/landlord/sell-list-view.tsx`
- `components/landlord/status-badge.tsx`

## Module 04 Core Files

- `app/landlord/actions.ts`
- `lib/landlord/queries.ts`
- `lib/landlord/types.ts`
- `lib/landlord/format.ts`
- `supabase/module_04_landlord_flow_revision.sql`

## Landlord Flows

Dashboard flow:

1. Active landlord opens `/landlord`.
2. Dashboard shows total buildings, total rooms, available rooms, coming soon rooms.
3. Actions link to add building and sell list.
4. Building cards link into building detail.

Building and room flow:

1. Landlord creates a building.
2. Landlord creates rooms under that building.
3. Rooms are always scoped to a building.
4. Landlord can edit building and room details.
5. Landlord can use building detail as the main inventory workspace.

Shared fee flow:

1. Landlord sets building-level fees in `building_fees`.
2. New rooms default to `fee_mode = building_default`.
3. Room detail computes effective fees from building fees unless the room uses override.
4. Room override fees are stored in `room_fees`.

Quick edit flow:

1. Building detail shows a compact room table.
2. Each row posts to `quickUpdateRoomAction`.
3. The action verifies ownership, updates `rooms.status`, `rooms.rent_price`, `rooms.deposit_amount`, and `rooms.available_from`.
4. The DB trigger handles `room_status_logs` when status changes.

Duplicate room flow:

1. Landlord opens `/landlord/rooms/[id]/duplicate`.
2. Landlord enters new room codes.
3. Duplicate action rejects duplicate room codes in the same building.
4. New rooms get fresh IDs and slugs from DB defaults.
5. Optional copy flags control price, deposit, area, description, fees, features, and images.
6. Status logs are not copied.

Sell list flow:

1. `/landlord/sell-list` shows all rooms with `available` or `coming_soon`.
2. `/landlord/buildings/[id]/sell-list` scopes to one building.
3. Rooms are grouped by building.
4. Copy button creates simple room text.
5. Zalo integration is not implemented.

Visibility/public logic:

- Business data uses `visibility = visible | hidden`.
- Landlord pages query by owner via `requireRole(["landlord"])` and landlord-scoped queries.
- Broker visibility is not a full dashboard in Module 04, but DB/RLS/view rules prepare for visible buildings/rooms and approved permissions.
- Public share routes `/l`, `/b`, `/r` are planned later and not implemented in Module 04.

## Verification

Passed:

- `.\node_modules\.bin\tsc.cmd --noEmit`
- `node .\node_modules\next\dist\bin\next build --webpack`
- Dev server `/login` returned HTTP 200.
- Supabase REST read checks returned HTTP 200 for:
  - `building_fees`
  - `rooms.fee_mode`, `rooms.min_lease_months`
  - new `room_fees` fee columns
  - `v_broker_rooms`

Known verification limitation:

- `corepack pnpm lint` fails because the script is `next lint`, which is invalid in the current Next 16 setup.

## Remaining Issues / Manual QA

- Active landlord CRUD should still be manually tested end to end against live Supabase.
- Building fee save should be manually tested.
- Room create/edit with both `building_default` and `room_override` should be manually tested.
- Quick edit should be manually tested and checked for status log creation.
- Duplicate room should be tested with duplicate code rejection and copy options.
- Upload flow should be tested against Storage policies.
- Broker/admin RLS behavior after Module 04 migration should be tested during Module 05/06.
