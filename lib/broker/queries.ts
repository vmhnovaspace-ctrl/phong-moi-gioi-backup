import {
  matchesBrokerRoomSmartSearch,
  normalizeBrokerSearchText,
  parseBrokerRoomSearchQuery
} from "@/lib/broker/search";
import type {
  BrokerDashboard,
  BrokerActionRoom,
  BrokerActionRoomSource,
  BrokerSendToCustomerData,
  BrokerActionWorkspaceRoom,
  BrokerInventoryFilters,
  BrokerInventoryResult,
  BrokerInventoryRoom,
  BrokerLandlordContact,
  CustomerRoomPackageSummary,
  BrokerRoomActionState,
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
  room_features:
    | Array<
        Pick<
          RoomFeature,
          | "allows_pet"
          | "has_air_conditioner"
          | "has_balcony"
          | "has_bed"
          | "has_elevator"
          | "has_fridge"
          | "has_washing_machine"
          | "has_parking"
          | "has_private_bathroom"
          | "has_private_kitchen"
          | "has_security"
          | "has_wardrobe"
          | "has_window"
          | "is_furnished"
        >
      >
    | null;
};

type BrokerRoomDetailRow = Room & {
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
type SavedActionRow = { room_id: string; updated_at: string; created_at: string };
type ActionRoomRow = BrokerRoomActionState & { room_id: string };
type CustomerPackageRow = Omit<CustomerRoomPackageSummary, "room_count">;
type CustomerPackageItemCountRow = { package_id: string };
type CustomerPackageEventRow = CustomerRoomPackageEvent;

const BROKER_INVENTORY_SELECT =
  "id, building_id, cover_image_url, room_code, title, floor, area_m2, rent_price, deposit_amount, status, available_from, commission, min_lease_months, room_drive_folder_url, description, strengths, weaknesses, updated_at, buildings!inner(id, name, address, ward, district, city, landlord_id, latitude, longitude, formatted_address, google_place_id, google_maps_url), room_features(allows_pet, has_air_conditioner, has_balcony, has_bed, has_elevator, has_fridge, has_washing_machine, has_parking, has_private_bathroom, has_private_kitchen, has_security, has_wardrobe, has_window, is_furnished), room_images(id, image_url, storage_path, source_type, sort_order, is_cover)";
const BROKER_INVENTORY_SELECT_FALLBACK =
  "id, building_id, cover_image_url, room_code, title, floor, area_m2, rent_price, deposit_amount, status, available_from, commission, min_lease_months, room_drive_folder_url, description, strengths, weaknesses, updated_at, buildings!inner(id, name, address, ward, district, city, landlord_id, google_maps_url), room_features(allows_pet, has_air_conditioner, has_balcony, has_bed, has_elevator, has_fridge, has_washing_machine, has_parking, has_private_bathroom, has_private_kitchen, has_security, has_wardrobe, has_window, is_furnished), room_images(id, image_url, storage_path, source_type, sort_order, is_cover)";
const BROKER_INVENTORY_PAGE_SIZE = 1000;

const BROKER_ROOM_DETAIL_SELECT =
  "*, buildings!inner(id, name, address, ward, district, city, latitude, longitude, formatted_address, google_place_id, google_maps_url, description, common_amenities, house_rules, building_drive_folder_url, landlord_id, building_fees(*))";
const BROKER_ROOM_DETAIL_SELECT_FALLBACK =
  "*, buildings!inner(id, name, address, ward, district, city, google_maps_url, description, common_amenities, house_rules, building_drive_folder_url, landlord_id, building_fees(*))";

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
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

async function getLandlordsById(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, BrokerLandlordContact>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
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
    features: row.room_features?.[0] ?? null,
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
    const landlordNeedle = normalizeBrokerSearchText(filters.landlord);
    const landlordHaystack = normalizeBrokerSearchText(
      `${room.landlord?.full_name ?? ""} ${room.landlord?.phone ?? ""}`
    );

    if (!landlordHaystack.includes(landlordNeedle)) {
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

  return matchesBrokerRoomSmartSearch(room, parseBrokerRoomSearchQuery(filters.q));
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

  if (error && isMissingMapColumnError(error)) {
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

async function rowsToInventoryRooms(rows: BrokerInventoryRoomRow[]) {
  const landlordIds = rows
    .map((row) => firstRelation(row.buildings)?.landlord_id ?? null)
    .filter((value): value is string => Boolean(value));
  const landlords = await getLandlordsById(landlordIds);
  const rooms = await Promise.all(rows.map((row) => toBrokerInventoryRoom(row, landlords)));

  return rooms.filter((room): room is BrokerInventoryRoom => room !== null);
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

export async function getBrokerInventory(filters: BrokerInventoryFilters): Promise<BrokerInventoryResult> {
  const rows = await fetchBrokerInventoryRows();
  const rooms = await rowsToInventoryRooms(rows);
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

  if (error && isMissingMapColumnError(error)) {
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
    { data: action, error: actionError }
  ] = await Promise.all([
    supabase.from("room_fees").select("*").eq("room_id", roomId).maybeSingle<RoomFee>(),
    supabase.from("room_features").select("*").eq("room_id", roomId).maybeSingle<RoomFeature>(),
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
      .maybeSingle<BrokerRoomActionRow>()
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

  const { buildings: _buildings, building_id: _buildingId, ...room } = data;
  const { building_fees: buildingFeeRows, ...rawBuilding } = buildingRelation;
  const building = withMapFieldDefaults(rawBuilding);
  const buildingFees = firstFee(buildingFeeRows);
  const signedImages = await Promise.all((images ?? []).map(signRoomImage));

  return {
    ...room,
    action: action ?? null,
    building,
    building_fees: buildingFees,
    effective_fees: room.fee_mode === "room_override" ? fees ?? null : buildingFees,
    fees: fees ?? null,
    features: features ?? null,
    images: signedImages,
    landlord: landlord ?? null
  } satisfies BrokerRoomDetail;
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

  if (roomsError && isMissingMapColumnError(roomsError)) {
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

  return {
    packages,
    rooms: inventory.rooms
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

  return {
    ...parsed,
    rooms: await Promise.all(
      parsed.rooms.map(async (room) => ({
        ...room,
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
    error.code === "PGRST204" ||
    message.includes("customer_room_package_events") ||
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
