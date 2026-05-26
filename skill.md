# Kho Phong Realtime - AI Coding Rulebook

This is the project rulebook for AI coding agents working in this repo. Read it before implementation changes.

## Project Goal

Kho Phong Realtime is a mobile-first web app for rental room operations in Vietnam.

Core data structure:

```text
Landlord -> Building/address -> Room
```

The app helps landlords maintain structured room availability data and helps brokers browse, save, prepare, and manually share suitable rooms with customers.

## Current Module State

The app has work from the first 6 modules:

- Module 01: PRD and product context.
- Module 02: Supabase base schema.
- Module 03: phone/password auth, roles, profile sync, pending/blocked routing.
- Module 04: landlord flow, building and room CRUD, shared building fees, room override fees, image inputs, duplicate room, sell lists.
- Module 05: building map/location fields and broker inventory foundation.
- Module 06: broker customer room packages, manual Zalo message copy, and public customer package pages.

Current key routes:

- Auth: `/login`, `/register`, `/forgot-password`, `/forgot-password/verify`, `/reset-password`, `/account/change-password`.
- Landlord: `/landlord`, `/landlord/buildings`, `/landlord/buildings/[id]`, `/landlord/rooms/[id]`, `/landlord/sell-list`.
- Broker: `/broker`, `/broker/rooms`, `/broker/rooms/[id]`, `/broker/saved`, `/broker/actions`, `/broker/send`.
- Public package: `/p/[packageSlug]`.
- Admin: `/admin`, `/admin/users`, `/admin/rooms`, `/admin/buildings`, `/admin/reports`.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime where applicable
- Vercel target hosting

## Commands

Preferred verification:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
node .\node_modules\next\dist\bin\next build --webpack
```

Development scripts:

```powershell
corepack pnpm dev
corepack pnpm dev:local
corepack pnpm dev:restart
corepack pnpm dev:stop
```

Known tooling issue: `corepack pnpm lint` currently calls `next lint`, which is invalid for the current Next 16 setup unless the lint script is updated.

## Authentication Rules

- Current auth architecture from Module 03 must not be changed casually.
- UI login/register uses phone number + password.
- Phone numbers are normalized to Vietnam `+84` format.
- Supabase Auth stores phone/password auth.
- Earlier context mentions internal virtual email `@phone.local`; current code primarily uses Supabase phone auth. Do not reintroduce email UI unless explicitly requested.
- `profiles` stores `full_name`, `phone`, `email`, `role`, `status`.
- Do not show virtual/internal email in UI.
- Route guards must always use current session/profile from server-side auth helpers.
- Pending users go to `/pending`.
- Blocked users go to `/blocked`.
- Unauthenticated users go to `/login`.

## Role Rules

- `admin`: system operator, can manage all users/data when UI and RLS allow.
- `landlord`: can manage only their own buildings, rooms, fees, room images, and room metadata.
- `broker`: can view broker-visible inventory and manage only broker-owned saved/action/report/package data.
- Do not let landlord CRUD accept arbitrary `landlord_id` from client input.
- Always derive owner identity from session/profile.

## Coding Rules

- Prefer existing patterns: server components, server actions, Supabase server client.
- Keep route-level guards in layouts/pages using `requireRole`.
- Keep user-facing text in Vietnamese.
- Do not refactor unrelated auth/admin/broker/landlord code while working on a narrow feature.
- Do not add Zalo API, Google Drive Picker, auto Chotot/Mogi/Facebook posting, or advanced image processing unless explicitly requested.
- Validate form input server-side.
- Use typed helper functions where reasonable; avoid broad `any`.
- Keep mobile-first UI and large touch targets.

## Database Rules

- Do not edit old migrations that may already have run, except for local documentation or clearly un-applied scratch work. Prefer new migration files.
- Use RLS and owner checks together. Server actions must still verify ownership even if RLS exists.
- Room status changes should update `rooms.status`; database trigger `room_status_logs` handles logging. Do not manually insert logs unless the trigger is removed or explicitly bypassed.
- Use `visibility = 'visible' | 'hidden'` rather than hard deleting business data unless requested.
- For private uploaded room images, render with signed URLs using `room_images.storage_path`.

## Important Migrations

- Module 03: `supabase/module_03_fix_handle_new_user.sql`
- Module 03: `supabase/module_03_phone_password_auth_migration.sql`
- Module 03: `supabase/module_03_verify_and_repair_profile_sync.sql`
- Module 04: `supabase/module_04_landlord_flow_revision.sql`
- Module 05: `supabase/module_05_broker_maps_fields.sql`
- Module 06: `supabase/module_06_customer_room_packages.sql`

Module 02 base schema is referenced externally in older context.

## Landlord Business Rules

- A building is a concrete address.
- A room must belong to exactly one building.
- Fees are usually shared at building level.
- A room can use `building_default` fees or `room_override` fees.
- Room duplicate flow must create new rooms with fresh IDs/slugs and must not copy status logs.
- If copy images is selected, copied rooms retain sellable image/link references.
- Sell list defaults to rooms with status `available` and `coming_soon` only.

## Broker Business Rules

- Broker inventory should default to visible buildings, visible rooms, and statuses `available` or `coming_soon`.
- Broker should not mutate landlord-owned building, room, fee, feature, or image data.
- Broker saved/actions/private notes belong in `broker_room_actions`.
- Broker reports belong in `room_reports`.
- Customer sharing packages belong in `customer_room_packages` and `customer_room_package_items`.
- Public package pages should hide exact sensitive address details where appropriate and should not expose landlord-only controls.
- Zalo support is manual copy/share only in MVP; do not add Zalo API unless requested.

## UI Rules

- UI language is Vietnamese.
- Mobile-first; desktop can use tables/compact lists when helpful.
- Landlord frequent actions are quick room status/price/deposit/available date edits.
- Broker frequent actions are filter/search, view room detail, save room, copy post text, track posting/sent state, report wrong info, and create customer packages.
- Keep cards readable and buttons large enough for phone use.
- Status badge colors:
  - `available`: green
  - `coming_soon`: blue
  - `reserved`: amber/orange
  - `rented`: gray
  - `hidden`: dark gray
- Do not redesign the global theme without explicit request.

## Stable Areas

Do not casually change:

- Module 03 auth architecture and route guards.
- Existing Supabase auth helper structure in `lib/auth/*` and `lib/supabase/*`.
- Existing role/status semantics.
- RLS ownership rules.
- Landlord ownership checks in `app/landlord/actions.ts`.
- Broker write boundaries in `broker_room_actions`, `room_reports`, and customer package tables.

## Out of Scope Unless Explicitly Requested

- Zalo API or Zalo Mini App.
- Automatic Chotot/Mogi/Facebook posting.
- Google Drive Picker.
- Advanced image gallery management, watermarking, or image processing.
- Hard deletes of business inventory.
- Rebuilding Module 03 auth.
