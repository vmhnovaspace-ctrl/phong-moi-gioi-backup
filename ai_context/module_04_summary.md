# Module 04 Summary - Landlord Flow

Last updated: 2026-05-19.

## Module Goal

Module 04 gives landlords a practical inventory workspace for managing rental buildings and rooms.

The module follows the product core:

```text
Landlord -> Building/address -> Room
```

The result is a structured, landlord-owned room inventory that can later power broker browsing, share links, copy templates, realtime updates, and reports.

## Business Flow

1. Landlord logs in with an active landlord profile.
2. Landlord creates one or more buildings.
3. Each building represents one concrete rental address.
4. Landlord creates rooms inside a building.
5. Landlord enters price, deposit, status, availability date, fees, lease term, description, features, and image references.
6. Landlord maintains room availability through the building detail quick edit table.
7. Landlord uses sell list to copy currently sellable rooms.

## UI Flow

Dashboard:

- Shows total buildings, total rooms, available rooms, coming soon rooms.
- Shows recent building cards.
- Provides primary actions:
  - add building
  - open sell list

Building detail:

- Shows building summary and room counts.
- Shows compact room inventory table.
- Lets landlord quick-edit status, rent, deposit, available date.
- Provides actions to view, edit, and duplicate each room.
- Shows shared fees as a compact summary with collapsible edit form.

Room form:

- Supports main room info.
- Supports fee mode:
  - building default
  - room override
- Supports room features.
- Supports image input by Drive folder URL, image links, and direct upload.
- Supports description, strengths, and weaknesses.

Room detail:

- Shows room details, effective fees, features, and image/Drive information.
- Uploaded images are rendered via signed URLs when possible.

Sell list:

- Groups sellable rooms by building.
- Shows only `available` and `coming_soon`.
- Supports copying simple room content.
- Zalo action is intentionally disabled placeholder.

## Data Flow

Main reads:

- `getLandlordDashboard(landlordId)`
- `getLandlordBuildingSummaries(landlordId)`
- `getLandlordBuildingDetail(buildingId, landlordId)`
- `getLandlordRoom(roomId, landlordId)`
- `getLandlordSellList(landlordId, buildingId?)`

Main writes:

- `createBuildingAction`
- `updateBuildingAction`
- `upsertBuildingFeesAction`
- `createRoomAction`
- `updateRoomAction`
- `quickUpdateRoomAction`
- `duplicateRoomAction`

Ownership:

- All server actions require landlord role.
- Building writes call `requireOwnedBuilding()`.
- Room writes call `requireOwnedRoom()`.
- Client never supplies trusted `landlord_id`.

## Landlord Workflow In Practice

Typical daily workflow:

1. Landlord opens `/landlord`.
2. Landlord checks how many rooms are available or coming soon.
3. Landlord opens a building.
4. Landlord updates room status/price/deposit/available date directly in the room table.
5. Landlord opens sell list to copy rooms that can be sent to brokers/Zalo manually.
6. When creating similar rooms, landlord duplicates an existing room and changes room codes.

## Shared Fee Flow

- Shared fees belong to the building in `building_fees`.
- A room can use shared fees through `rooms.fee_mode = building_default`.
- A room can override fees through `rooms.fee_mode = room_override` and `room_fees`.
- Room detail returns `effective_fees` for display.

## Duplicate Room Flow

- Source room must belong to current landlord.
- User enters one or more room codes.
- The action checks duplicates within the same building.
- New rows are inserted into `rooms`.
- Copy flags control whether related data is copied.
- Status logs are not copied.
- Uploaded image storage files are not duplicated; metadata references are copied.

## Sell List Flow

- Data comes from `rooms` joined to owned `buildings`.
- Default statuses are `available` and `coming_soon`.
- Results are grouped by building.
- No broker-specific filters are applied in landlord sell list.
- No Zalo API integration exists.

## Key Technical Decisions

- Keep Module 03 auth architecture stable.
- Use server actions, not client-side Supabase writes, for landlord mutations.
- Use owner checks in server actions even though RLS exists.
- Keep shared fees at building level because fees are usually common for a rental address.
- Keep room override fees for exceptions.
- Keep `visibility` instead of hard delete.
- Use DB trigger for room status logs.
- Use Supabase Storage for uploads and `room_images` metadata for all image sources.
- Use signed URLs for private uploaded image display.

## Lessons Learned

- `v_broker_rooms` should be dropped and recreated when view columns shift because `create or replace view` with `r.*` caused a column-name error.
- The live app can appear broken when the dev server is down; Windows/OneDrive and non-ASCII paths can affect `node_modules` shims.
- Quick-edit tables need compact UI because landlords will use building detail as an operational screen.
- Image metadata and physical uploaded files should be treated separately.

## Assumptions

- Landlord users are active before they can use Module 04.
- A building equals one concrete rental address.
- Most rooms in a building share fees.
- Manual Zalo sharing is enough for MVP.
- Broker dashboard and public share links are later modules.
- Storage bucket `room-images` exists and policies follow Module 02/04 assumptions.

## Future Improvements

- Inline row-level quick edit success/error feedback.
- Better image gallery, delete/reorder/cover selection.
- More complete sell copy templates.
- Share links `/l/[slug]`, `/b/[slug]`, `/r/[slug]`.
- Broker browsing dashboard.
- Realtime update banner for brokers.
- Admin moderation of room reports.
- Better lint setup for Next 16.
