# Current Project Status

Last updated: 2026-05-26, Asia/Bangkok.

## Project Name

Kho Phong Realtime / Phong Moi Gioi.

## Product Goal

Mobile-first rental room operations app for Vietnam. The core data model is:

```text
Landlord -> Building/address -> Room
```

The product helps landlords maintain structured room inventory, and helps brokers search, save, prepare, package, and manually share suitable rooms with customers.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Realtime where applicable
- Vercel target hosting
- pnpm

## Completed Modules

- Module 01: product/PRD context captured in `PROJECT_CONTEXT.md`, `PRD_MVP_V1.md`, and `ai_context`.
- Module 02: Supabase base schema exists in `module_02_supabase_schema.sql`.
- Module 03: phone/password auth, profile sync, role/status routing, pending/blocked routing, forgot/reset/change password.
- Module 04: landlord inventory flow, buildings, rooms, fees, image inputs, duplicate rooms, quick edit, sell lists.
- Module 05: building map/location fields and broker-facing inventory foundation.
- Module 06: broker customer room packages, manual Zalo message copy, public package links.
- Later migrations/files are present for public share links and customer interest events: `supabase/module_07_public_share_links.sql` and `supabase/module_10_customer_interest_events.sql`.

## In Progress / Not Fully QA'd

- Broker workflow manual QA across real logged-in broker session.
- Public share links and customer interest events need real-data QA.
- Broker send/customer package UI should be tested end to end with live Supabase data.
- Zalo integration remains manual copy/open only; no Zalo API integration.
- Image management is still MVP-level: links/uploads exist, but no cover management/reorder/delete workflow.

## Known Issues / Pending Checks

- `corepack pnpm lint` is not reliable because `package.json` still uses `next lint`, which is invalid for the current Next 16 setup unless the lint script is fixed.
- `.env.local` exists locally and must never be committed.
- Local folder was not a Git repository before this backup.
- Manual QA is still needed for landlord CRUD, room duplicate, storage uploads, broker package creation, and customer interest events.
- Supabase schema state may differ between local files and any live project if migrations were manually applied.

## Important Product Decisions

- User-facing UI text should be Vietnamese.
- Phone/password auth uses Vietnam `+84` normalization.
- Do not show internal/virtual email in UI.
- Role guards must use server-side auth helpers and `requireRole([...])`.
- Landlord ownership is derived from session/profile, never arbitrary client input.
- Business records use `visibility = 'visible' | 'hidden'` instead of hard delete.
- Room status changes update `rooms.status`; database triggers write `room_status_logs`.
- Broker private state belongs in `broker_room_actions`.
- Customer package data belongs in `customer_room_packages` and `customer_room_package_items`.
- Zalo support is manual copy/share only unless explicitly requested later.

## Main Code Areas

- App routes: `app/`
- Shared UI components: `components/`
- Auth helpers: `lib/auth/`
- Supabase helpers: `lib/supabase/`
- Landlord queries/types/format: `lib/landlord/`
- Broker queries/search/templates/types: `lib/broker/`
- Share/public query/template code: `lib/share/`
- Location helpers: `src/lib/location-options.ts`, `src/lib/location-utils.ts`, `lib/vietnam-hcmc-locations.ts`
- Supabase migrations/schema: `supabase/`, `module_02_supabase_schema.sql`
- AI handoff context: `ai_context/`, `skill.md`, `AGENTS.md`

## Run Locally

Install dependencies:

```powershell
corepack pnpm install
```

Required public environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

Run dev server:

```powershell
corepack pnpm dev
```

Alternative local scripts:

```powershell
corepack pnpm dev:local
corepack pnpm dev:restart
corepack pnpm dev:stop
```

Preferred checks:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
node .\node_modules\next\dist\bin\next build --webpack
```

## Continue With Codex Business After Workspace Merge

1. Open the merged Business workspace at this project root.
2. Ask Codex Business to read:
   - `PROJECT_CONTEXT.md`
   - `PRD_MVP_V1.md`
   - `CURRENT_PROJECT_STATUS.md`
   - `CODEX_HANDOFF_PROMPT.md`
   - `IMPORTANT_FILES_INDEX.md`
   - `AGENTS.md`
   - `skill.md`
   - `ai_context/*.md`
   - `package.json`
   - `supabase/*.sql`
3. Do not ask it to rewrite the app. Ask it to report its understanding first.
4. Give one concrete task at a time.
5. Keep database changes additive and migration-based.
6. Never expose service-role keys or commit `.env.local`.
