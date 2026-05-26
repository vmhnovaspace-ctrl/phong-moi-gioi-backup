# Important Files Index

Last updated: 2026-05-26.

## Project Documentation

- `PROJECT_CONTEXT.md` - High-level product and project context.
- `PRD_MVP_V1.md` - MVP product requirements and intended workflows.
- `CURRENT_PROJECT_STATUS.md` - Current backup status and continuation notes.
- `CODEX_HANDOFF_PROMPT.md` - Prompt to use when handing off to Codex Business.
- `BACKUP_BEFORE_BUSINESS_MERGE.md` - Backup metadata for this Git/GitHub snapshot.
- `AGENTS.md` - Agent instructions for this repository.
- `skill.md` - Local coding rulebook and project-specific implementation guidance.
- `ai_context/current_status.md` - Earlier module status notes.
- `ai_context/system_architecture.md` - Architecture overview.
- `ai_context/business_rules.md` - Product and workflow rules.
- `ai_context/db_rules.md` - Database and RLS rules.
- `ai_context/ui_rules.md` - UI rules and style guidance.
- `ai_context/known_issues.md` - Known risks and manual QA notes.

## Schema And Migration Files

- `module_02_supabase_schema.sql` - Base Supabase schema reference.
- `supabase/module_03_fix_handle_new_user.sql` - Profile sync/auth trigger repair.
- `supabase/module_03_phone_password_auth_migration.sql` - Phone/password auth migration.
- `supabase/module_03_verify_and_repair_profile_sync.sql` - Verification/repair for profile sync.
- `supabase/module_04_landlord_flow_revision.sql` - Landlord inventory, fees, duplicate room support.
- `supabase/module_05_broker_maps_fields.sql` - Location/map fields and broker inventory foundation.
- `supabase/module_06_customer_room_packages.sql` - Customer room packages and public package links.
- `supabase/module_07_public_share_links.sql` - Public share link support.
- `supabase/module_10_customer_interest_events.sql` - Customer interest event tracking.

## Auth And Route Guard Files

- `app/(auth)/actions.ts` - Login, register, forgot/reset/change password server actions.
- `app/(auth)/login/login-form.tsx` - Phone/password login UI.
- `app/(auth)/register/register-form.tsx` - Registration UI.
- `app/account/change-password/change-password-form.tsx` - Change password UI.
- `lib/auth/profile.ts` - Current user/profile helpers and `requireRole`.
- `lib/auth/phone.ts` - Vietnam phone normalization.
- `lib/auth/roles.ts` - Role/status labels and home route decisions.
- `lib/auth/types.ts` - Auth/profile types.
- `lib/supabase/server.ts` - Server Supabase client.
- `lib/supabase/client.ts` - Browser Supabase client.
- `lib/supabase/middleware.ts` - Session refresh middleware helper.
- `proxy.ts` - Next proxy/middleware entry.

## Dashboard And Shell Files

- `components/dashboard/role-shell.tsx` - Shared role dashboard shell.
- `components/dashboard/role-nav.tsx` - Role navigation links.
- `components/dashboard/module-card.tsx` - Dashboard card component.
- `app/admin/layout.tsx` - Admin route guard/layout.
- `app/broker/layout.tsx` - Broker route guard/layout.
- `app/landlord/layout.tsx` - Landlord route guard/layout.
- `app/admin/page.tsx` - Admin dashboard.
- `app/broker/page.tsx` - Broker dashboard route.
- `app/landlord/page.tsx` - Landlord dashboard route.

## Room, Listing, Filter, And Location Files

- `app/landlord/actions.ts` - Landlord server actions for building/room/fees/images/duplicate/quick edit.
- `lib/landlord/queries.ts` - Landlord read queries.
- `lib/landlord/types.ts` - Landlord domain types.
- `lib/landlord/format.ts` - Formatting helpers and room status labels.
- `components/landlord/building-form.tsx` - Building create/edit form.
- `components/landlord/room-form.tsx` - Room create/edit form.
- `components/landlord/room-quick-list.tsx` - Quick edit room table.
- `components/landlord/sell-list-view.tsx` - Landlord sell list UI.
- `components/landlord/status-badge.tsx` - Room status badge.
- `app/broker/rooms/page.tsx` - Broker inventory route.
- `app/broker/rooms/[id]/page.tsx` - Broker room detail route.
- `components/broker/broker-inventory-view.tsx` - Broker inventory grouped view.
- `components/broker/broker-filter-bar.tsx` - Broker room filters.
- `components/broker/broker-room-card.tsx` - Broker room card.
- `components/broker/broker-room-detail.tsx` - Broker room detail UI.
- `lib/broker/search.ts` - Broker smart search utilities.
- `src/lib/location-options.ts` - Current HCMC location options.
- `src/lib/location-utils.ts` - Location matching utilities.
- `lib/vietnam-hcmc-locations.ts` - Legacy/known HCMC district and ward lists.

## Broker Workflow, Customer Package, And Zalo Files

- `app/broker/actions.ts` - Broker room action, saved state, reports, and read event actions.
- `app/broker/actions/page.tsx` - Broker action workspace route.
- `app/broker/saved/page.tsx` - Broker saved rooms route.
- `app/broker/send/page.tsx` - Customer send/package route.
- `app/broker/send/actions.ts` - Customer package server actions.
- `app/broker/send/create/route.ts` - API route to create package.
- `components/broker/broker-dashboard.tsx` - Broker dashboard.
- `components/broker/broker-actions-view.tsx` - Broker action workspace.
- `components/broker/broker-saved-watchlist.tsx` - Dashboard saved watchlist.
- `components/broker/broker-saved-rooms-view.tsx` - Saved rooms full view.
- `components/broker/broker-send-to-customer-view.tsx` - Send-to-customer package workflow and manual Zalo message copy.
- `components/broker/room-post-generator-button.tsx` - Room post generation/copy helper.
- `components/broker/broker-room-actions-panel.tsx` - Broker room action state panel.
- `components/broker/broker-room-note-panel.tsx` - Broker notes.
- `components/broker/broker-room-report-panel.tsx` - Broker report panel.
- `components/broker/broker-realtime-updates.tsx` - Realtime update UI.
- `lib/broker/queries.ts` - Broker dashboard, inventory, room, package, and event queries.
- `lib/broker/post-templates.ts` - Broker/customer message templates.
- `lib/broker/types.ts` - Broker domain types.
- `app/p/[packageSlug]/page.tsx` - Public customer package page.
- `app/p/[packageSlug]/interest/route.ts` - Customer interest event route.

## Public Share Files

- `app/l/[landlordSlug]/page.tsx` - Public landlord page.
- `app/b/[buildingSlug]/page.tsx` - Public building page.
- `app/r/[roomSlug]/page.tsx` - Public room page.
- `components/share/share-pages.tsx` - Shared public page components.
- `components/share/safe-image.tsx` - Safe image rendering.
- `components/share/copy-link-button.tsx` - Copy public link button.
- `components/share/copy-text-button.tsx` - Copy text helper.
- `lib/share/queries.ts` - Public share read queries.
- `lib/share/templates.ts` - Public share message templates.
- `lib/share/types.ts` - Public share types.

## Admin Files

- `app/admin/actions.ts` - Admin actions.
- `app/admin/users/page.tsx` - User management.
- `app/admin/rooms/page.tsx` - Room management.
- `app/admin/buildings/page.tsx` - Building management.
- `app/admin/reports/page.tsx` - Report management.
- `components/admin/admin-ui.tsx` - Admin UI components.
- `lib/admin/queries.ts` - Admin queries.
- `lib/admin/types.ts` - Admin types.
- `lib/admin/labels.ts` - Admin display labels.
