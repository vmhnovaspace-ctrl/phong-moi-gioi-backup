# Kho Phong Realtime - Agent Guide

Read this before making code changes in this repository.

## Project

Kho Phong Realtime is a mobile-first Next.js app for rental room operations in Vietnam.

Core model:

```text
Landlord -> Building/address -> Room
```

The product helps landlords maintain structured room inventory, then helps brokers search, save, prepare, and share suitable rooms with customers.

## Current Module State

The local app now contains work through the first 6 modules:

- Module 01: product/PRD context.
- Module 02: Supabase base schema.
- Module 03: phone/password auth, profile sync, role/status routing.
- Module 04: landlord inventory flow, building fees, room override fees, image inputs, duplicate rooms, sell lists.
- Module 05: location/map fields for buildings and broker-facing inventory foundation.
- Module 06: broker customer room packages, manual Zalo message copy, and public package links at `/p/[packageSlug]`.

Important migration files in this repo:

- `supabase/module_03_fix_handle_new_user.sql`
- `supabase/module_03_phone_password_auth_migration.sql`
- `supabase/module_03_verify_and_repair_profile_sync.sql`
- `supabase/module_04_landlord_flow_revision.sql`
- `supabase/module_05_broker_maps_fields.sql`
- `supabase/module_06_customer_room_packages.sql`

## Read First

For a new session, read these first:

- `skill.md`
- `ai_context/current_status.md`
- `ai_context/system_architecture.md`
- `ai_context/business_rules.md`
- `ai_context/db_rules.md`
- `ai_context/ui_rules.md`
- `ai_context/known_issues.md`
- Relevant files under `app/`, `components/`, and `lib/` for the requested task.

Some `ai_context` files may lag behind the latest Module 05/06 implementation. Treat code and migrations as the source of truth when they conflict with old handoff notes.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime where applicable
- Vercel target hosting

## Commands

Preferred checks:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
node .\node_modules\next\dist\bin\next build --webpack
```

Development:

```powershell
corepack pnpm dev
corepack pnpm dev:local
corepack pnpm dev:restart
corepack pnpm dev:stop
```

Known tooling issue: `corepack pnpm lint` currently uses `next lint`, which is invalid in the current Next 16 setup unless the lint script is fixed.

## Environment

Required public environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

Never expose service-role keys to client code.

## Auth Rules

- Keep Module 03 auth architecture stable.
- Login/register uses phone number + password.
- Phone numbers are normalized to Vietnam `+84` format.
- Supabase Auth uses phone/password auth.
- `profiles` stores `full_name`, `phone`, `email`, `role`, `status`.
- Do not show virtual/internal email in UI.
- Route guards must use current session/profile from server-side auth helpers.
- Pending users go to `/pending`.
- Blocked users go to `/blocked`.
- Unauthenticated users go to `/login`.
- Role routes must use `requireRole([...])`.

## Role Rules

- `admin`: system operator, can manage data where UI/RLS allow.
- `landlord`: manages only their own buildings, rooms, fees, images, and room metadata.
- `broker`: views broker-visible rooms and writes only broker-owned actions, reports, saved state, and customer packages.
- Do not let landlord CRUD accept arbitrary `landlord_id` from client input.
- Always derive owner identity from session/profile.

## Database Rules

- Prefer additive migration files for schema that may already have run.
- Do not edit old applied migrations unless the user explicitly asks and understands the risk.
- Keep RLS enabled and preserve owner checks in server actions.
- Do not weaken RLS just to make a UI query pass.
- Room status changes should update `rooms.status`; the database trigger writes `room_status_logs`.
- Use `visibility = 'visible' | 'hidden'` instead of hard deleting business data unless requested.
- For uploaded room images, use `room_images.storage_path` and signed URLs when storage is private.

## UI Rules

- User-facing text should be Vietnamese.
- Keep UI mobile-first with large touch targets.
- Use compact, scan-friendly SaaS UI for operational screens.
- Do not redesign the global theme without explicit request.
- Broker/landlord dashboards should prioritize real workflows over marketing pages.

## Business Rules

- A building is a concrete address.
- A room must belong to exactly one building.
- Fees usually live at building level in `building_fees`.
- A room can use `building_default` fees or `room_override` fees.
- Duplicate room flow must create fresh room IDs/slugs and must not copy status logs.
- Landlord sell lists include `available` and `coming_soon`.
- Broker inventory defaults to visible rooms/buildings and sellable statuses.
- Broker private state belongs in `broker_room_actions`.
- Customer room package data belongs in `customer_room_packages` and `customer_room_package_items`.

## Explicitly Out of Scope Unless Requested

- Zalo API integration.
- Zalo Mini App.
- Automatic Chotot/Mogi/Facebook posting.
- Google Drive Picker.
- Watermarking or advanced image processing.
- Replacing server actions with client-side Supabase writes.
- Rebuilding Module 03 auth from scratch.
