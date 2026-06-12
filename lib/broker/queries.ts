import { matchesBrokerLandlordSearch } from "@/lib/broker/search";
import type {
  BrokerDashboard,
  BrokerActionRoom,
  BrokerActionRoomSource,
  BrokerClosedRoom,
  BrokerClosedRoomPeriod,
  BrokerSendToCustomerData,
  BrokerActionWorkspaceRoom,
  BrokerInventoryFilters,
  BrokerInventoryResult,
  BrokerInventoryRoom,
  BrokerLandlordContact,
  CustomerRoomPackageSummary,
  BrokerRoomActionState,
  BrokerRoomCloseRequestState,
  BrokerRoomDetail,
  BrokerRoomImage,
  BrokerRoomListItem,
  BrokerRoomThumbnail,
  PublicCustomerRoomPackage,
  PublicPackageImage,
  BrokerSavedRoom,
  CustomerRoomPackageEvent
} from "@/lib/broker/types";
import type { Building, BuildingFee, Room, RoomFeature, RoomFee, RoomImage } from "@/lib/landlord/types";
import { normalizeRoomLayoutValues } from "@/lib/rooms/room-metadata";
import { createClient } from "@/lib/supabase/server";
import { matchesLocationFilter } from "@/src/lib/location-utils";

type BrokerBuildingRow = Pick<
  Building,
  | "id"
  | "name"
  | "address"
  | "ward"
  | "district"
  | "city"
  | "landlord_id"
  | "latitude"
  | "longitude"
  | "formatted_address"
  | "google_place_id"
  | "google_maps_url"
>;

type BrokerRoomRow = Pick<
  Room,
  | "id"
  | "building_id"
  | "cover_image_url"
  | "room_code"
  | "title"
  | "floor"
  | "area_m2"
  | "rent_price"
  | "deposit_amount"
  | "max_people"
  | "status"
  | "available_from"
  | "commission"
  | "min_lease_months"
  | "room_drive_folder_url"
  | "description"
  | "strengths"
  | "weaknesses"
  | "updated_at"
> & {
  buildings: BrokerBuildingRow | BrokerBuildingRow[];
  room_layouts?: string[] | null;
};

type BrokerInventoryRoomRow = BrokerRoomRow & {
  room_images:
    | Array<
        Pick<
          RoomImage,
          "id" | "image_url" | "storage_path" | "source_type" | "sort_order" | "is_cover"
        >
      >
    | null;
  room_features: BrokerInventoryFeatureRow | BrokerInventoryFeatureRow[] | null;
};

type BrokerInventoryFeatureRow = BrokerInventoryRoom["features"] & {
  updated_at?: string | null;
};

type BrokerRoomDetailRow = Omit<Room, "room_layouts"> & { room_layouts?: string[] | null } & {
  buildings:
    | (BrokerBuildingRow &
        Pick<
          Building,
          "description" | "common_amenities" | "house_rules" | "building_drive_folder_url"
        > & {
          building_fees: BuildingFee[] | null;
        })
    | Array<
        BrokerBuildingRow &
          Pick<
            Building,
            "description" | "common_amenities" | "house_rules" | "building_drive_folder_url"
          > & {
            building_fees: BuildingFee[] | null;
          }
      >;
};

type BrokerProfileRow = BrokerLandlordContact;
type BrokerRoomActionRow = BrokerRoomActionState;
type BrokerRoomCloseRequestRow = BrokerRoomCloseRequestState;
type SavedActionRow = { room_id: string; updated_at: string; created_at: string };
type ActionRoomRow = BrokerRoomActionState & { room_id: string };
type CustomerPackageRow = Omit<CustomerRoomPackageSummary, "room_count">;
type CustomerPackageItemCountRow = { package_id: string };
type CustomerPackageEventRow = CustomerRoomPackageEvent;
type CustomerInterestRoomRow = Pick<CustomerRoomPackageEvent, "room_id" | "updated_at" | "created_at">;

const BROKER_ROOM_LIST_SELECT =
  "id, building_id, cover_image_url, room_code, title, floor, area_m2, rent_price, deposit_amount, max_people, status, available_from, commission, min_lease_months, room_drive_folder_url, room_layouts, description, strengths, weaknesses, updated_at";
const BROKER_ROOM_LIST_SELECT_WITHOUT_LAYOUTS =
  "id, building_id, cover_image_url, room_code, title, floor, area_m2, rent_price, deposit_amount, max_people, status, available_from, commission, min_lease_months, room_drive_folder_url, description, strengths, weaknesses, updated_at";
const BROKER_INVENTORY_SELECT =
  `${BROKER_ROOM_LIST_SELECT}, buildings!inner(id, name, address, ward, district, city, landlord_id, latitude, longitude, formatted_address, google_place_id, google_maps_url), room_features(allows_pet, has_air_conditioner, has_balcony, has_bed, has_elevator, has_fridge, has_washing_machine, has_parking, has_private_bathroom, has_private_kitchen, has_security, has_wardrobe, has_window, is_furnished, updated_at), room_images(id, image_url, storage_path, source_type, sort_order, is_cover)`;
const BROKER_INVENTORY_SELECT_FALLBACK =
  `${BROKER_ROOM_LIST_SELECT_WITHOUT_LAYOUTS}, buildings!inner(id, name, address, ward, district, city, landlord_id, google_maps_url), room_features(allows_pet, has_air_conditioner, has_balcony, has_bed, has_elevator, has_fridge, has_washing_machine, has_parking, has_private_bathroom, has_private_kitchen, has_security, has_wardrobe, has_window, is_furnished, updated_at), room_images(id, image_url, storage_path, source_type, sort_order, is_cover)`;
const BROKER_CLOSED_ROOM_SELECT =
  `${BROKER_ROOM_LIST_SELECT}, buildings!inner(id, name, address, ward, district, city, landlord_id, latitude, longitude, formatted_address, google_place_id, google_maps_url)`;
const BROKER_CLOSED_ROOM_SELECT_FALLBACK =
  `${BROKER_ROOM_LIST_SELECT_WITHOUT_LAYOUTS}, buildings!inner(id, name, address, ward, district, city, landlord_id, google_maps_url)`;
const BROKER_INVENTORY_PAGE_SIZE = 1000;

const BROKER_ROOM_DETAIL_FIELDS =
  "id, building_id, cover_image_url, room_code, title, floor, area_m2, rent_price, deposit_amount, max_people, status, available_from, commission, min_lease_months, fee_mode, room_drive_folder_url, room_layouts, description, strengths, weaknesses, public_slug, visibility, created_at, updated_at";
const BROKER_ROOM_DETAIL_FIELDS_WITHOUT_LAYOUTS =
  "id, building_id, cover_image_url, room_code, title, floor, area_m2, rent_price, deposit_amount, max_people, status, available_from, commission, min_lease_months, fee_mode, room_drive_folder_url, description, strengths, weaknesses, public_slug, visibility, created_at, updated_at";
const BROKER_ROOM_DETAIL_SELECT =
  `${BROKER_ROOM_DETAIL_FIELDS}, buildings!inner(id, name, address, ward, district, city, latitude, longitude, formatted_address, google_place_id, google_maps_url, description, common_amenities, house_rules, building_drive_folder_url, landlord_id, building_fees(*))`;
const BROKER_ROOM_DETAIL_SELECT_FALLBACK =
  `${BROKER_ROOM_DETAIL_FIELDS_WITHOUT_LAYOUTS}, buildings!inner(id, name, address, ward, district, city, google_maps_url, description, common_amenities, house_rules, building_drive_folder_url, landlord_id, building_fees(*))`;
const BROKER_CLOSE_REQUEST_SELECT =
  "id, room_id, broker_id, landlord_id, status, broker_note, landlord_note, created_at, updated_at, resolved_at";
const BROKER_CLOSE_REQUEST_SELECT_WITH_ACK = `${BROKER_CLOSE_REQUEST_SELECT}, broker_acknowledged_at`;
const BROKER_VISIBLE_CLOSE_REQUEST_STATUSES = [
  "pending",
  "approved",
  "confirmed",
  "completed",
  "rejected"
] as const;
const BROKER_CLOSED_REQUEST_STATUSES = ["approved", "confirmed", "completed"] as const;

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function latestRelation<T extends { updated_at?: string | null }>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  if (!Array.isArray(value)) {
    return value;
  }

  return [...value].sort((a, b) => {
    return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
  })[0] ?? null;
}

function firstFee(value: BuildingFee[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : null;
}

function withMapFieldDefaults<T extends Partial<BrokerBuildingRow>>(building: T): T & BrokerBuildingRow {
  return {
    ...building,
    latitude: building.latitude ?? null,
    longitude: building.longitude ?? null,
    formatted_address: building.formatted_address ?? null,
    google_place_id: building.google_place_id ?? null
  } as T & BrokerBuildingRow;
}

function isMissingMapColumnError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "PGRST204" ||
    message.includes("latitude") ||
    message.includes("longitude") ||
    message.includes("formatted_address") ||
    message.includes("google_place_id")
  );
}

function isMissingBrokerAckColumnError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes("broker_acknowledged_at")
  );
}

function withCloseRequestAckDefaults(
  rows: Array<Omit<BrokerRoomCloseRequestRow, "broker_acknowledged_at">> | null
): BrokerRoomCloseRequestRow[] {
  return (rows ?? []).map((row) => ({
    ...row,
    broker_acknowledged_at: null
  }));
}

function isBrokerClosedRequestStatus(status: BrokerRoomCloseRequestRow["status"]) {
  return BROKER_CLOSED_REQUEST_STATUSES.includes(
    status as (typeof BROKER_CLOSED_REQUEST_STATUSES)[number]
  );
}

function isMissingRoomLayoutsColumnError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    message.includes("room_layouts") ||
    message.includes("schema cache")
  );
}

function getBrokerCloseRequestConfirmedAt(closeRequest: Pick<
  BrokerRoomCloseRequestRow,
  "resolved_at" | "updated_at" | "created_at"
>) {
  return closeRequest.resolved_at ?? closeRequest.updated_at ?? closeRequest.created_at;
}

function normalizeBrokerCloseRequest(closeRequest: BrokerRoomCloseRequestRow) {
  if (!isBrokerClosedRequestStatus(closeRequest.status) || closeRequest.status === "approved") {
    return closeRequest;
  }

  return {
    ...closeRequest,
    status: "approved"
  } satisfies BrokerRoomCloseRequestRow;
}

async function getLandlordsById(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, BrokerLandlordContact>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, public_slug")
    .in("id", Array.from(new Set(ids)))
    .returns<BrokerProfileRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

function toBrokerRoom(
  row: BrokerRoomRow,
  landlords: Map<string, BrokerLandlordContact>
): BrokerRoomListItem | null {
  const building = firstRelation(row.buildings);

  if (!building || (row.status !== "available" && row.status !== "coming_soon")) {
    return null;
  }

  const { buildings: _buildings, building_id: _buildingId, ...room } = row;
  const normalizedBuilding = withMapFieldDefaults(building);

  return {
    ...room,
    room_layouts: normalizeRoomLayoutValues(room.room_layouts ?? []),
    building: normalizedBuilding,
    landlord: landlords.get(normalizedBuilding.landlord_id) ?? null
  };
}

async function signRoomThumbnail(
  image: Pick<
    RoomImage,
    "id" | "image_url" | "storage_path" | "source_type" | "sort_order" | "is_cover"
  >
): Promise<BrokerRoomThumbnail> {
  if (image.source_type !== "uploaded" || !image.storage_path) {
    return {
      id: image.id,
      image_url: image.image_url,
      is_cover: image.is_cover,
      sort_order: image.sort_order,
      source_type: image.source_type
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("room-images")
    .createSignedUrl(image.storage_path, 60 * 60);

  return {
    id: image.id,
    image_url: data?.signedUrl ?? image.image_url,
    is_cover: image.is_cover,
    sort_order: image.sort_order,
    source_type: image.source_type
  };
}

async function signRoomImage(image: RoomImage): Promise<BrokerRoomImage> {
  if (image.source_type !== "uploaded" || !image.storage_path) {
    return {
    id: image.id,
    image_type: image.image_type,
    image_url: image.image_url,
    is_cover: image.is_cover,
    sort_order: image.sort_order,
    source_type: image.source_type
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("room-images")
    .createSignedUrl(image.storage_path, 60 * 60);

  return {
    id: image.id,
    image_type: image.image_type,
    image_url: data?.signedUrl ?? image.image_url,
    is_cover: image.is_cover,
    sort_order: image.sort_order,
    source_type: image.source_type
  };
}

async function signPublicPackageImage(image: PublicPackageImage): Promise<PublicPackageImage> {
  if (image.source_type !== "uploaded" || !image.storage_path) {
    return image;
  }

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("room-images")
    .createSignedUrl(image.storage_path, 60 * 60);

  return {
    ...image,
    image_url: data?.signedUrl ?? image.image_url
  };
}

async function toBrokerInventoryRoom(
  row: BrokerInventoryRoomRow,
  landlords: Map<string, BrokerLandlordContact>
) {
  const room = toBrokerRoom(row, landlords);

  if (!room) {
    return null;
  }

  const image = [...(row.room_images ?? [])].sort((a, b) => {
    if (a.is_cover !== b.is_cover) {
      return a.is_cover ? -1 : 1;
    }

    return a.sort_order - b.sort_order;
  })[0];

  return {
    ...room,
    features: latestRelation(row.room_features) ?? null,
    thumbnail: image ? await signRoomThumbnail(image) : null
  } satisfies BrokerInventoryRoom;
}

function numberValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function locationAddress(building: { address?: string | null; formatted_address?: string | null; name?: string | null }) {
  return [building.address, building.formatted_address, building.name].filter(Boolean).join(" ");
}

function filterInventoryRoom(room: BrokerInventoryRoom, filters: BrokerInventoryFilters) {
  if (filters.status && filters.status !== "all" && room.status !== filters.status) {
    return false;
  }

  if (filters.landlordId && filters.landlordId !== room.building.landlord_id && filters.landlordId !== room.landlord?.id) {
    return false;
  }

  if (
    !matchesLocationFilter({
      geoMode: filters.boundaryMode === "new" ? "current" : "old",
      selectedDistrict: filters.boundaryMode === "new" ? undefined : filters.district,
      selectedWard: filters.ward,
      district: room.building.district,
      ward: room.building.ward,
      address: locationAddress(room.building)
    })
  ) {
    return false;
  }

  if (filters.landlord) {
    const normalizedLandlordFilter = filters.landlord.trim().toLowerCase();
    const matchesExactLandlord =
      normalizedLandlordFilter === room.landlord?.public_slug?.toLowerCase() ||
      normalizedLandlordFilter === room.landlord?.id.toLowerCase() ||
      normalizedLandlordFilter === room.building.landlord_id.toLowerCase();

    if (
      !matchesExactLandlord &&
      !matchesBrokerLandlordSearch({
        input: filters.landlord,
        landlordName: room.landlord?.full_name,
        landlordPhone: room.landlord?.phone
      })
    ) {
      return false;
    }
  }

  if (filters.minPrice !== undefined && room.rent_price < filters.minPrice) {
    return false;
  }

  if (filters.maxPrice !== undefined && room.rent_price > filters.maxPrice) {
    return false;
  }

  const area = numberValue(room.area_m2);

  if (filters.minArea !== undefined && (area === null || area < filters.minArea)) {
    return false;
  }

  if (filters.maxArea !== undefined && (area === null || area > filters.maxArea)) {
    return false;
  }

  if (filters.furnished && !room.features?.is_furnished) {
    return false;
  }

  if (filters.allowsPet && !room.features?.allows_pet) {
    return false;
  }

  return true;
}

function uniqueSorted(values: Array<string | null>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])).sort(
    (a, b) => a.localeCompare(b, "vi")
  );
}

function groupInventoryRooms(rooms: BrokerInventoryRoom[]) {
  const landlordMap = new Map<string, BrokerInventoryRoom[]>();

  for (const room of rooms) {
    const key = room.landlord?.id ?? room.building.landlord_id;
    landlordMap.set(key, [...(landlordMap.get(key) ?? []), room]);
  }

  return Array.from(landlordMap.values())
    .map((landlordRooms) => {
      const buildingMap = new Map<string, BrokerInventoryRoom[]>();

      for (const room of landlordRooms) {
        buildingMap.set(room.building.id, [...(buildingMap.get(room.building.id) ?? []), room]);
      }

      const buildings = Array.from(buildingMap.values())
        .map((buildingRooms) => ({
          available_rooms: buildingRooms.filter((room) => room.status === "available").length,
          building: buildingRooms[0].building,
          coming_soon_rooms: buildingRooms.filter((room) => room.status === "coming_soon").length,
          rooms: buildingRooms.sort(
            (a, b) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime() ||
              a.room_code.localeCompare(b.room_code, "vi", { numeric: true })
          )
        }))
        .sort((a, b) => a.building.name.localeCompare(b.building.name, "vi"));

      return {
        buildings,
        landlord: landlordRooms[0].landlord,
        total_rooms: landlordRooms.length
      };
    })
    .sort(
      (a, b) =>
        (a.landlord?.full_name ?? "").localeCompare(b.landlord?.full_name ?? "", "vi") ||
        b.total_rooms - a.total_rooms
    );
}

async function fetchBrokerInventoryPage(from: number, to: number) {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("rooms")
    .select(BROKER_INVENTORY_SELECT)
    .eq("visibility", "visible")
    .eq("buildings.visibility", "visible")
    .in("status", ["available", "coming_soon"])
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to)
    .returns<BrokerInventoryRoomRow[]>();

  if (error && (isMissingMapColumnError(error) || isMissingRoomLayoutsColumnError(error))) {
    const fallback = await supabase
      .from("rooms")
      .select(BROKER_INVENTORY_SELECT_FALLBACK)
      .eq("visibility", "visible")
      .eq("buildings.visibility", "visible")
      .in("status", ["available", "coming_soon"])
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to)
      .returns<BrokerInventoryRoomRow[]>();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function fetchBrokerInventoryRows(limit?: number) {
  const rows: BrokerInventoryRoomRow[] = [];
  let from = 0;

  while (limit === undefined || rows.length < limit) {
    const remaining = limit === undefined ? BROKER_INVENTORY_PAGE_SIZE : limit - rows.length;
    const pageSize = Math.min(BROKER_INVENTORY_PAGE_SIZE, remaining);
    const page = await fetchBrokerInventoryPage(from, from + pageSize - 1);

    rows.push(...page);

    if (page.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

async function fetchRoomLayoutsByIds(roomIds: string[]) {
  if (roomIds.length === 0) {
    return new Map<string, string[] | null>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, room_layouts")
    .in("id", Array.from(new Set(roomIds)))
    .returns<Array<{ id: string; room_layouts: string[] | null }>>();

  if (error) {
    if (isMissingRoomLayoutsColumnError(error)) {
      return new Map<string, string[] | null>();
    }

    throw new Error(error.message);
  }

  return new Map(
    (data ?? []).map((row) => [row.id, normalizeRoomLayoutValues(row.room_layouts ?? [])])
  );
}

async function rowsToInventoryRooms(rows: BrokerInventoryRoomRow[]) {
  const landlordIds = rows
    .map((row) => firstRelation(row.buildings)?.landlord_id ?? null)
    .filter((value): value is string => Boolean(value));
  const landlords = await getLandlordsById(landlordIds);
  const rooms = await Promise.all(rows.map((row) => toBrokerInventoryRoom(row, landlords)));
  const filteredRooms = rooms.filter((room): room is BrokerInventoryRoom => room !== null);
  const missingRoomLayoutIds = filteredRooms
    .filter((room) => !Array.isArray(room.room_layouts) || room.room_layouts.length === 0)
    .map((room) => room.id);

  if (missingRoomLayoutIds.length === 0) {
    return filteredRooms;
  }

  const roomLayoutsById = await fetchRoomLayoutsByIds(missingRoomLayoutIds);

  return filteredRooms.map((room) => ({
    ...room,
    room_layouts:
      Array.isArray(room.room_layouts) && room.room_layouts.length > 0
        ? normalizeRoomLayoutValues(room.room_layouts)
        : roomLayoutsById.get(room.id) ?? []
  }));
}

async function attachBrokerCloseRequests(rooms: BrokerInventoryRoom[], brokerId?: string) {
  if (!brokerId || rooms.length === 0) {
    return rooms;
  }

  const supabase = await createClient();
  let { data, error } = await supabase
    .from("room_close_requests")
    .select(BROKER_CLOSE_REQUEST_SELECT_WITH_ACK)
    .eq("broker_id", brokerId)
    .in("room_id", rooms.map((room) => room.id))
    .in("status", [...BROKER_VISIBLE_CLOSE_REQUEST_STATUSES])
    .order("created_at", { ascending: false })
    .returns<BrokerRoomCloseRequestRow[]>();

  if (error && isMissingBrokerAckColumnError(error)) {
    const fallback = await supabase
      .from("room_close_requests")
      .select(BROKER_CLOSE_REQUEST_SELECT)
      .eq("broker_id", brokerId)
      .in("room_id", rooms.map((room) => room.id))
      .in("status", [...BROKER_VISIBLE_CLOSE_REQUEST_STATUSES])
      .order("created_at", { ascending: false })
      .returns<Array<Omit<BrokerRoomCloseRequestRow, "broker_acknowledged_at">>>();
    data = withCloseRequestAckDefaults(fallback.data ?? null);
    error = fallback.error;
  }

  if (error) {
    if (isMissingRoomCloseRequestsTable(error)) {
      return rooms;
    }

    throw new Error(error.message);
  }

  const requestByRoomId = new Map<string, BrokerRoomCloseRequestRow>();

  for (const rawRequest of data ?? []) {
    const request = normalizeBrokerCloseRequest(rawRequest);

    if (request.status !== "pending" && request.broker_acknowledged_at) {
      continue;
    }

    const existingRequest = requestByRoomId.get(request.room_id);

    if (!existingRequest || (request.status === "pending" && existingRequest.status !== "pending")) {
      requestByRoomId.set(request.room_id, request);
    }
  }

  return rooms.map((room) => ({
    ...room,
    close_request: requestByRoomId.get(room.id) ?? null
  }));
}

export async function getBrokerDashboard(brokerId: string): Promise<BrokerDashboard> {
  const rows = await fetchBrokerInventoryRows();
  const rooms = await rowsToInventoryRooms(rows);
  const [savedRooms, customerInterestEvents, unreadCustomerInterestCount] = await Promise.all([
    getBrokerSavedRooms(brokerId, 5),
    getBrokerCustomerInterestEvents(brokerId, 5),
    getBrokerCustomerInterestUnreadCount(brokerId)
  ]);

  return {
    available_rooms: rooms.filter((room) => room.status === "available").length,
    coming_soon_rooms: rooms.filter((room) => room.status === "coming_soon").length,
    customer_interest_events: customerInterestEvents,
    recent_rooms: rooms.slice(0, 5),
    saved_rooms: savedRooms,
    total_visible_rooms: rooms.length,
    unread_customer_interest_count: unreadCustomerInterestCount
  };
}

export async function getBrokerInventory(filters: BrokerInventoryFilters, brokerId?: string): Promise<BrokerInventoryResult> {
  const rows = await fetchBrokerInventoryRows();
  const rooms = await attachBrokerCloseRequests(await rowsToInventoryRooms(rows), brokerId);
  const filteredRooms = rooms.filter((room) => filterInventoryRoom(room, filters));

  return {
    filters,
    groups: groupInventoryRooms(filteredRooms),
    options: {
      districts: uniqueSorted(rooms.map((room) => room.building.district ?? null)),
      wards: uniqueSorted(
        rooms
          .filter((room) => {
            if (!filters.district) {
              return true;
            }

            return matchesLocationFilter({
              geoMode: "old",
              selectedDistrict: filters.district,
              district: room.building.district,
              ward: room.building.ward,
              address: locationAddress(room.building)
            });
          })
          .map((room) => room.building.ward ?? null)
      )
    },
    rooms: filteredRooms,
    totalBeforeFilters: rooms.length
  };
}

export async function getBrokerRoom(roomId: string, brokerId: string): Promise<BrokerRoomDetail | null> {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("rooms")
    .select(BROKER_ROOM_DETAIL_SELECT)
    .eq("id", roomId)
    .eq("visibility", "visible")
    .eq("buildings.visibility", "visible")
    .in("status", ["available", "coming_soon"])
    .maybeSingle<BrokerRoomDetailRow>();

  if (error && (isMissingMapColumnError(error) || isMissingRoomLayoutsColumnError(error))) {
    const fallback = await supabase
      .from("rooms")
      .select(BROKER_ROOM_DETAIL_SELECT_FALLBACK)
      .eq("id", roomId)
      .eq("visibility", "visible")
      .eq("buildings.visibility", "visible")
      .in("status", ["available", "coming_soon"])
      .maybeSingle<BrokerRoomDetailRow>();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const buildingRelation = firstRelation(data.buildings);

  if (!buildingRelation) {
    return null;
  }

  const [
    { data: fees, error: feesError },
    { data: features, error: featuresError },
    { data: images, error: imagesError },
    { data: landlord, error: landlordError },
    { data: action, error: actionError },
    { data: closeRequest, error: closeRequestError }
  ] = await Promise.all([
    supabase.from("room_fees").select("*").eq("room_id", roomId).maybeSingle<RoomFee>(),
    supabase
      .from("room_features")
      .select("*")
      .eq("room_id", roomId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<RoomFeature>(),
    supabase.from("room_images").select("*").eq("room_id", roomId).order("sort_order").returns<RoomImage[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", buildingRelation.landlord_id)
      .maybeSingle<BrokerProfileRow>(),
    supabase
      .from("broker_room_actions")
      .select("is_saved, posted_chotot, posted_mogi, posted_facebook, sent_to_customer, customer_note, private_note, updated_at")
      .eq("broker_id", brokerId)
      .eq("room_id", roomId)
      .maybeSingle<BrokerRoomActionRow>(),
    supabase
      .from("room_close_requests")
      .select("id, room_id, broker_id, landlord_id, status, broker_note, landlord_note, created_at, updated_at, resolved_at, broker_acknowledged_at")
      .eq("broker_id", brokerId)
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<BrokerRoomCloseRequestRow>()
  ]);

  if (feesError) {
    throw new Error(feesError.message);
  }

  if (featuresError) {
    throw new Error(featuresError.message);
  }

  if (imagesError) {
    throw new Error(imagesError.message);
  }

  if (landlordError) {
    throw new Error(landlordError.message);
  }

  if (actionError) {
    throw new Error(actionError.message);
  }

  if (closeRequestError && !isMissingRoomCloseRequestsTable(closeRequestError)) {
    throw new Error(closeRequestError.message);
  }

  const { buildings: _buildings, building_id: _buildingId, ...room } = data;
  const { building_fees: buildingFeeRows, ...rawBuilding } = buildingRelation;
  const building = withMapFieldDefaults(rawBuilding);
  const buildingFees = firstFee(buildingFeeRows);
  const signedImages = await Promise.all((images ?? []).map(signRoomImage));

  return {
    ...room,
    room_layouts: normalizeRoomLayoutValues(Array.isArray(room.room_layouts) ? room.room_layouts : []),
    action: action ?? null,
    building,
    building_fees: buildingFees,
    effective_fees: room.fee_mode === "room_override" ? fees ?? null : buildingFees,
    fees: fees ?? null,
    features: features ?? null,
    images: signedImages,
    landlord: landlord ?? null,
    close_request: closeRequestError ? null : closeRequest ? normalizeBrokerCloseRequest(closeRequest) : null
  } satisfies BrokerRoomDetail;
}

export async function getBrokerRoomCloseRequest(
  roomId: string,
  brokerId: string
): Promise<BrokerRoomCloseRequestState | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_close_requests")
    .select("id, room_id, broker_id, landlord_id, status, broker_note, landlord_note, created_at, updated_at, resolved_at, broker_acknowledged_at")
    .eq("broker_id", brokerId)
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<BrokerRoomCloseRequestRow>();

  if (error) {
    if (isMissingRoomCloseRequestsTable(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return data ? normalizeBrokerCloseRequest(data) : null;
}

async function getBrokerClosedRoomIdSet(brokerId: string, roomIds: string[]) {
  if (roomIds.length === 0) {
    return new Set<string>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_close_requests")
    .select("room_id, status")
    .eq("broker_id", brokerId)
    .in("room_id", roomIds)
    .in("status", [...BROKER_CLOSED_REQUEST_STATUSES])
    .returns<Array<Pick<BrokerRoomCloseRequestRow, "room_id" | "status">>>();

  if (error) {
    if (isMissingRoomCloseRequestsTable(error)) {
      return new Set<string>();
    }

    throw new Error(error.message);
  }

  return new Set(
    (data ?? [])
      .filter((request) => isBrokerClosedRequestStatus(request.status))
      .map((request) => request.room_id)
  );
}

export async function getBrokerSavedRooms(brokerId: string, limit?: number): Promise<BrokerSavedRoom[]> {
  const supabase = await createClient();
  let query = supabase
    .from("broker_room_actions")
    .select("room_id, updated_at, created_at")
    .eq("broker_id", brokerId)
    .eq("is_saved", true)
    .order("updated_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query.returns<SavedActionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const actions = data ?? [];
  const savedRoomIds = actions.map((row) => row.room_id);

  if (savedRoomIds.length === 0) {
    return [];
  }

  let { data: roomsData, error: roomsError } = await supabase
    .from("rooms")
    .select(BROKER_INVENTORY_SELECT)
    .eq("visibility", "visible")
    .eq("buildings.visibility", "visible")
    .in("status", ["available", "coming_soon"])
    .in("id", savedRoomIds)
    .returns<BrokerInventoryRoomRow[]>();

  if (roomsError && isMissingMapColumnError(roomsError)) {
    const fallback = await supabase
      .from("rooms")
      .select(BROKER_INVENTORY_SELECT_FALLBACK)
      .eq("visibility", "visible")
      .eq("buildings.visibility", "visible")
      .in("status", ["available", "coming_soon"])
      .in("id", savedRoomIds)
      .returns<BrokerInventoryRoomRow[]>();
    roomsData = fallback.data;
    roomsError = fallback.error;
  }

  if (roomsError) {
    throw new Error(roomsError.message);
  }

  const actionByRoomId = new Map(actions.map((action) => [action.room_id, action]));
  const rooms = await rowsToInventoryRooms(roomsData ?? []);

  return rooms
    .map((room) => ({
      ...room,
      saved_at: actionByRoomId.get(room.id)?.updated_at ?? actionByRoomId.get(room.id)?.created_at ?? room.updated_at
    }))
    .sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
}

export async function getBrokerHandledCustomerInterestRooms(
  brokerId: string,
  limit = 50
): Promise<BrokerInventoryRoom[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_room_package_events")
    .select("room_id, created_at, updated_at")
    .eq("broker_id", brokerId)
    .eq("is_read", true)
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<CustomerInterestRoomRow[]>();

  if (error) {
    if (isMissingCustomerInterestEventTable(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  const seenRoomIds = new Set<string>();
  const roomIds = (data ?? [])
    .map((row) => row.room_id)
    .filter((roomId) => {
      if (seenRoomIds.has(roomId)) {
        return false;
      }

      seenRoomIds.add(roomId);
      return true;
    });

  if (roomIds.length === 0) {
    return [];
  }

  const closedRoomIds = await getBrokerClosedRoomIdSet(brokerId, roomIds);
  const activeRoomIds = roomIds.filter((roomId) => !closedRoomIds.has(roomId));

  if (activeRoomIds.length === 0) {
    return [];
  }

  let { data: roomsData, error: roomsError } = await supabase
    .from("rooms")
    .select(BROKER_INVENTORY_SELECT)
    .eq("visibility", "visible")
    .eq("buildings.visibility", "visible")
    .in("status", ["available", "coming_soon"])
    .in("id", activeRoomIds)
    .returns<BrokerInventoryRoomRow[]>();

  if (roomsError && (isMissingMapColumnError(roomsError) || isMissingRoomLayoutsColumnError(roomsError))) {
    const fallback = await supabase
      .from("rooms")
      .select(BROKER_INVENTORY_SELECT_FALLBACK)
      .eq("visibility", "visible")
      .eq("buildings.visibility", "visible")
      .in("status", ["available", "coming_soon"])
      .in("id", activeRoomIds)
      .returns<BrokerInventoryRoomRow[]>();
    roomsData = fallback.data;
    roomsError = fallback.error;
  }

  if (roomsError) {
    throw new Error(roomsError.message);
  }

  const roomOrder = new Map(activeRoomIds.map((roomId, index) => [roomId, index]));
  const rooms = await rowsToInventoryRooms(roomsData ?? []);

  return rooms.sort((a, b) => (roomOrder.get(a.id) ?? 0) - (roomOrder.get(b.id) ?? 0));
}

function getClosedRoomDateRange(period: BrokerClosedRoomPeriod) {
  const now = new Date();
  const bangkokParts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Bangkok",
    year: "numeric"
  }).formatToParts(now);
  const year = Number(bangkokParts.find((part) => part.type === "year")?.value);
  const month = Number(bangkokParts.find((part) => part.type === "month")?.value);
  const day = Number(bangkokParts.find((part) => part.type === "day")?.value);
  const bangkokOffsetMs = 7 * 60 * 60 * 1000;
  const start = new Date(Date.UTC(year, month - 1, day) - bangkokOffsetMs);

  if (period === "week") {
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    start.setUTCDate(start.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  }

  if (period === "month") {
    start.setTime(Date.UTC(year, month - 1, 1) - bangkokOffsetMs);
  }

  return { end: now, start };
}

function toBrokerClosedRoom(
  row: BrokerRoomRow,
  closeRequest: BrokerRoomCloseRequestRow,
  landlords: Map<string, BrokerLandlordContact>
): BrokerClosedRoom | null {
  const building = firstRelation(row.buildings);

  if (!building || !isBrokerClosedRequestStatus(closeRequest.status)) {
    return null;
  }

  const { buildings: _buildings, building_id: _buildingId, ...room } = row;
  const normalizedBuilding = withMapFieldDefaults(building);

  return {
    ...room,
    room_layouts: normalizeRoomLayoutValues(Array.isArray(room.room_layouts) ? room.room_layouts : []),
    building: normalizedBuilding,
    close_request: {
      ...closeRequest,
      status: "approved"
    },
    confirmed_at: getBrokerCloseRequestConfirmedAt(closeRequest),
    landlord: landlords.get(normalizedBuilding.landlord_id) ?? null
  };
}

export async function getBrokerClosedRooms(
  brokerId: string,
  period: BrokerClosedRoomPeriod = "today"
): Promise<BrokerClosedRoom[]> {
  const supabase = await createClient();
  const { end, start } = getClosedRoomDateRange(period);
  const { data, error } = await supabase
    .from("room_close_requests")
    .select(BROKER_CLOSE_REQUEST_SELECT)
    .eq("broker_id", brokerId)
    .in("status", [...BROKER_CLOSED_REQUEST_STATUSES])
    .order("resolved_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .returns<Array<Omit<BrokerRoomCloseRequestRow, "broker_acknowledged_at">>>();

  if (error) {
    if (isMissingRoomCloseRequestsTable(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  const requestsByRoomId = new Map<string, BrokerRoomCloseRequestRow>();

  for (const request of withCloseRequestAckDefaults(data ?? null)) {
    if (!isBrokerClosedRequestStatus(request.status)) {
      continue;
    }

    const confirmedAt = new Date(getBrokerCloseRequestConfirmedAt(request)).getTime();

    if (Number.isNaN(confirmedAt) || confirmedAt < start.getTime() || confirmedAt > end.getTime()) {
      continue;
    }

    const existing = requestsByRoomId.get(request.room_id);

    if (!existing) {
      requestsByRoomId.set(request.room_id, request);
      continue;
    }

    const existingConfirmedAt = new Date(getBrokerCloseRequestConfirmedAt(existing)).getTime();

    if (confirmedAt > existingConfirmedAt) {
      requestsByRoomId.set(request.room_id, request);
    }
  }

  const requests = Array.from(requestsByRoomId.values());
  const roomIds = requests.map((request) => request.room_id);

  if (roomIds.length === 0) {
    return [];
  }

  let { data: roomsData, error: roomsError } = await supabase
    .from("rooms")
    .select(BROKER_CLOSED_ROOM_SELECT)
    .eq("visibility", "visible")
    .eq("buildings.visibility", "visible")
    .in("id", roomIds)
    .returns<BrokerRoomRow[]>();

  if (roomsError && (isMissingMapColumnError(roomsError) || isMissingRoomLayoutsColumnError(roomsError))) {
    const fallback = await supabase
      .from("rooms")
      .select(BROKER_CLOSED_ROOM_SELECT_FALLBACK)
      .eq("visibility", "visible")
      .eq("buildings.visibility", "visible")
      .in("id", roomIds)
      .returns<BrokerRoomRow[]>();
    roomsData = fallback.data;
    roomsError = fallback.error;
  }

  if (roomsError) {
    throw new Error(roomsError.message);
  }

  const requestByRoomId = new Map(requests.map((request) => [request.room_id, request]));
  const landlordIds = (roomsData ?? [])
    .map((row) => firstRelation(row.buildings)?.landlord_id ?? null)
    .filter((value): value is string => Boolean(value));
  const landlords = await getLandlordsById(landlordIds);

  return (roomsData ?? [])
    .map((row) => {
      const request = requestByRoomId.get(row.id);

      return request ? toBrokerClosedRoom(row, request, landlords) : null;
    })
    .filter((room): room is BrokerClosedRoom => room !== null)
    .sort((a, b) => new Date(b.confirmed_at).getTime() - new Date(a.confirmed_at).getTime());
}

export async function getBrokerActionRooms(brokerId: string): Promise<BrokerActionRoom[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broker_room_actions")
    .select(
      "room_id, is_saved, posted_chotot, posted_mogi, posted_facebook, sent_to_customer, customer_note, private_note, updated_at"
    )
    .eq("broker_id", brokerId)
    .or(
      "posted_chotot.eq.true,posted_mogi.eq.true,posted_facebook.eq.true,sent_to_customer.eq.true,private_note.not.is.null,customer_note.not.is.null"
    )
    .order("updated_at", { ascending: false })
    .returns<ActionRoomRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const actions = data ?? [];
  const roomIds = actions.map((row) => row.room_id);

  if (roomIds.length === 0) {
    return [];
  }

  let { data: roomsData, error: roomsError } = await supabase
    .from("rooms")
    .select(BROKER_INVENTORY_SELECT)
    .eq("visibility", "visible")
    .eq("buildings.visibility", "visible")
    .in("status", ["available", "coming_soon"])
    .in("id", roomIds)
    .returns<BrokerInventoryRoomRow[]>();

  if (roomsError && (isMissingMapColumnError(roomsError) || isMissingRoomLayoutsColumnError(roomsError))) {
    const fallback = await supabase
      .from("rooms")
      .select(BROKER_INVENTORY_SELECT_FALLBACK)
      .eq("visibility", "visible")
      .eq("buildings.visibility", "visible")
      .in("status", ["available", "coming_soon"])
      .in("id", roomIds)
      .returns<BrokerInventoryRoomRow[]>();
    roomsData = fallback.data;
    roomsError = fallback.error;
  }

  if (roomsError) {
    throw new Error(roomsError.message);
  }

  const actionByRoomId = new Map(actions.map((action) => [action.room_id, action]));
  const rooms = await rowsToInventoryRooms(roomsData ?? []);

  return rooms
    .map((room) => {
      const action = actionByRoomId.get(room.id);

      if (!action) {
        return null;
      }

      const { room_id: _roomId, ...actionState } = action;

      return {
        ...room,
        action: actionState
      } satisfies BrokerActionRoom;
    })
    .filter((room): room is BrokerActionRoom => room !== null)
    .sort((a, b) => new Date(b.action.updated_at).getTime() - new Date(a.action.updated_at).getTime());
}

export async function getBrokerActionWorkspaceRooms(brokerId: string): Promise<BrokerActionWorkspaceRoom[]> {
  const [savedRooms, trackedRooms, recentRows] = await Promise.all([
    getBrokerSavedRooms(brokerId),
    getBrokerActionRooms(brokerId),
    fetchBrokerInventoryRows(10)
  ]);
  const recentRooms = await rowsToInventoryRooms(recentRows);
  const sourcesByRoomId = new Map<string, Set<BrokerActionRoomSource>>();

  for (const room of savedRooms) {
    sourcesByRoomId.set(room.id, new Set([...(sourcesByRoomId.get(room.id) ?? []), "saved"]));
  }

  for (const room of trackedRooms) {
    sourcesByRoomId.set(room.id, new Set([...(sourcesByRoomId.get(room.id) ?? []), "tracked"]));
  }

  for (const room of recentRooms) {
    sourcesByRoomId.set(room.id, new Set([...(sourcesByRoomId.get(room.id) ?? []), "recent"]));
  }

  const roomIds = Array.from(sourcesByRoomId.keys());
  const details = await Promise.all(roomIds.map((roomId) => getBrokerRoom(roomId, brokerId)));

  return details
    .filter((room): room is BrokerRoomDetail => room !== null)
    .map((room) => ({
      ...room,
      action_sources: Array.from(sourcesByRoomId.get(room.id) ?? [])
    }))
    .sort((a, b) => {
      const trackedDiff = Number(b.action_sources.includes("tracked")) - Number(a.action_sources.includes("tracked"));

      if (trackedDiff !== 0) {
        return trackedDiff;
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
}

export async function getBrokerSendToCustomerData(brokerId: string): Promise<BrokerSendToCustomerData> {
  const [inventory, packages] = await Promise.all([
    getBrokerInventory({}),
    getBrokerCustomerRoomPackages(brokerId)
  ]);
  const [customerInterestEvents, unreadCustomerInterestCount] = await Promise.all([
    getBrokerCustomerInterestEvents(brokerId, 10),
    getBrokerCustomerInterestUnreadCount(brokerId)
  ]);

  return {
    customer_interest_events: customerInterestEvents,
    packages,
    rooms: inventory.rooms,
    unread_customer_interest_count: unreadCustomerInterestCount
  };
}

export async function getBrokerCustomerRoomPackages(
  brokerId: string,
  limit = 8
): Promise<CustomerRoomPackageSummary[]> {
  const supabase = await createClient();
  const { data: packages, error } = await supabase
    .from("customer_room_packages")
    .select("id, customer_name, customer_phone, customer_zalo_link, customer_need, title, public_slug, status, created_at, updated_at")
    .eq("broker_id", brokerId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<CustomerPackageRow[]>();

  if (error) {
    if (isMissingCustomerPackageTable(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  const rows = packages ?? [];
  const packageIds = rows.map((row) => row.id);

  if (packageIds.length === 0) {
    return [];
  }

  const { data: items, error: itemError } = await supabase
    .from("customer_room_package_items")
    .select("package_id")
    .in("package_id", packageIds)
    .returns<CustomerPackageItemCountRow[]>();

  if (itemError) {
    if (isMissingCustomerPackageTable(itemError)) {
      return rows.map((row) => ({ ...row, room_count: 0 }));
    }

    throw new Error(itemError.message);
  }

  const countByPackageId = new Map<string, number>();

  for (const item of items ?? []) {
    countByPackageId.set(item.package_id, (countByPackageId.get(item.package_id) ?? 0) + 1);
  }

  return rows.map((row) => ({
    ...row,
    room_count: countByPackageId.get(row.id) ?? 0
  }));
}

export async function getBrokerCustomerInterestEvents(
  brokerId: string,
  limit = 10
): Promise<CustomerRoomPackageEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_room_package_events")
    .select(
      "id, package_id, package_public_slug, room_id, broker_id, customer_name, customer_phone, customer_zalo_link, customer_need, room_code, room_name, house_address, action_type, is_read, created_at, updated_at"
    )
    .eq("broker_id", brokerId)
    .eq("is_read", false)
    .order("is_read", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<CustomerPackageEventRow[]>();

  if (error) {
    if (isMissingCustomerInterestEventTable(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getBrokerCustomerInterestUnreadCount(brokerId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("customer_room_package_events")
    .select("id", { count: "exact", head: true })
    .eq("broker_id", brokerId)
    .eq("is_read", false);

  if (error) {
    if (isMissingCustomerInterestEventTable(error)) {
      return 0;
    }

    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getPublicCustomerRoomPackage(
  packageSlug: string
): Promise<PublicCustomerRoomPackage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_customer_room_package_public", {
    package_slug: packageSlug
  });

  if (error) {
    if (isMissingCustomerPackageTable(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const parsed = normalizePublicPackage(data);

  if (!parsed) {
    return null;
  }

  let roomLayoutsById = new Map<string, string[] | null>();
  const roomIds = parsed.rooms.map((room) => room.id);

  if (roomIds.length > 0) {
    const { data: roomLayoutRows, error: roomLayoutsError } = await supabase
      .from("rooms")
      .select("id, room_layouts")
      .in("id", roomIds)
      .returns<Array<{ id: string; room_layouts: string[] | null }>>();

    if (roomLayoutsError) {
      if (!isMissingRoomLayoutsColumnError(roomLayoutsError)) {
        throw new Error(roomLayoutsError.message);
      }
    } else {
      roomLayoutsById = new Map(
        (roomLayoutRows ?? []).map((row) => [row.id, Array.isArray(row.room_layouts) ? row.room_layouts : null])
      );
    }
  }

  return {
    ...parsed,
    rooms: await Promise.all(
      parsed.rooms.map(async (room) => ({
        ...room,
        room_layouts: room.room_layouts ?? roomLayoutsById.get(room.id) ?? null,
        images: await Promise.all(room.images.map(signPublicPackageImage))
      }))
    )
  };
}

function isMissingCustomerPackageTable(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "42883" ||
    message.includes("customer_room_packages") ||
    message.includes("customer_room_package_items") ||
    message.includes("get_customer_room_package_public")
  );
}

function isMissingCustomerInterestEventTable(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "42883" ||
    error.code === "PGRST204" ||
    message.includes("customer_room_package_events") ||
    message.includes("schema cache")
  );
}

function isMissingRoomCloseRequestsTable(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    message.includes("room_close_requests") ||
    message.includes("schema cache")
  );
}

function normalizePublicPackage(value: unknown): PublicCustomerRoomPackage | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Partial<PublicCustomerRoomPackage>;

  if (!raw.id || !raw.public_slug || !raw.title || !raw.customer_need || !Array.isArray(raw.rooms)) {
    return null;
  }

  return {
    created_at: String(raw.created_at ?? ""),
    customer_name: typeof raw.customer_name === "string" ? raw.customer_name : null,
    customer_need: String(raw.customer_need),
    id: String(raw.id),
    public_slug: String(raw.public_slug),
    rooms: raw.rooms.map(normalizePublicPackageRoom).filter((room): room is PublicCustomerRoomPackage["rooms"][number] => Boolean(room)),
    title: String(raw.title)
  };
}

function normalizePublicPackageRoom(value: unknown): PublicCustomerRoomPackage["rooms"][number] | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as PublicCustomerRoomPackage["rooms"][number];

  if (!raw.id) {
    return null;
  }

  return {
    area_m2: raw.area_m2 ?? null,
    building_drive_folder_url: typeof raw.building_drive_folder_url === "string" ? raw.building_drive_folder_url : null,
    cover_image_url: typeof raw.cover_image_url === "string" ? raw.cover_image_url : null,
    deposit_amount: typeof raw.deposit_amount === "number" ? raw.deposit_amount : null,
    description: typeof raw.description === "string" ? raw.description : null,
    features: raw.features && typeof raw.features === "object" ? raw.features : null,
    id: String(raw.id),
    images: Array.isArray(raw.images)
      ? raw.images
          .map(normalizePublicPackageImage)
          .filter((image): image is PublicPackageImage => Boolean(image))
      : [],
    location: typeof raw.location === "string" ? raw.location : "",
    max_people: typeof raw.max_people === "number" ? raw.max_people : null,
    rent_price: typeof raw.rent_price === "number" ? raw.rent_price : 0,
    room_drive_folder_url: typeof raw.room_drive_folder_url === "string" ? raw.room_drive_folder_url : null,
    room_layouts: Array.isArray(raw.room_layouts)
      ? raw.room_layouts.filter((value): value is string => typeof value === "string")
      : null,
    strengths: typeof raw.strengths === "string" ? raw.strengths : null,
    title: typeof raw.title === "string" ? raw.title : null
  };
}

function normalizePublicPackageImage(value: unknown): PublicPackageImage | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as PublicPackageImage;

  if (!raw.id || !raw.image_url || !raw.source_type) {
    return null;
  }

  return {
    id: String(raw.id),
    image_type: raw.image_type,
    image_url: String(raw.image_url),
    is_cover: Boolean(raw.is_cover),
    sort_order: typeof raw.sort_order === "number" ? raw.sort_order : 0,
    source_type: raw.source_type,
    storage_path: typeof raw.storage_path === "string" ? raw.storage_path : null
  };
}
