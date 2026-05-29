import { roomSortCompare } from "@/lib/landlord/format";
import type {
  Building,
  BuildingDetail,
  BuildingFee,
  BuildingSummary,
  LandlordRoomCloseRequest,
  Room,
  RoomFeature,
  RoomFee,
  RoomImage,
  RoomListItem,
  RoomSellEvent,
  RoomStatus,
  RoomWithBuilding,
  SellListClosedRoom,
  SellListDashboard,
  SellListGroup
} from "@/lib/landlord/types";
import { createClient } from "@/lib/supabase/server";

type BuildingWithRoomsRow = Building & {
  rooms: Array<Pick<Room, "id" | "status">> | null;
};

type BuildingDetailRow = Building & {
  building_fees: BuildingFee[] | null;
  rooms: Array<Room & { room_images: Array<Pick<RoomImage, "id">> | null }> | null;
};

type RoomWithBuildingRow = Room & {
  buildings:
    | (Building & {
        building_fees: BuildingFee[] | null;
      })
    | Array<
        Building & {
          building_fees: BuildingFee[] | null;
        }
      >;
};

type LandlordRoomCloseRequestRow = Omit<LandlordRoomCloseRequest, "broker"> & {
  broker:
    | NonNullable<LandlordRoomCloseRequest["broker"]>
    | Array<NonNullable<LandlordRoomCloseRequest["broker"]>>
    | null;
};

const LANDLORD_BUILDING_SUMMARY_SELECT =
  "id, landlord_id, name, address, ward, district, city, latitude, longitude, formatted_address, google_place_id, google_maps_url, description, common_amenities, house_rules, building_drive_folder_url, zalo_group_url, zalo_group_name, cover_image_url, public_slug, visibility, created_at, updated_at, rooms(id, status)";
const LANDLORD_BUILDING_SUMMARY_SELECT_FALLBACK =
  "id, landlord_id, name, address, ward, district, city, google_maps_url, description, common_amenities, house_rules, building_drive_folder_url, cover_image_url, public_slug, visibility, created_at, updated_at, rooms(id, status)";
const LANDLORD_BUILDING_DETAIL_SELECT =
  "id, landlord_id, name, address, ward, district, city, latitude, longitude, formatted_address, google_place_id, google_maps_url, description, common_amenities, house_rules, building_drive_folder_url, zalo_group_url, zalo_group_name, cover_image_url, public_slug, visibility, created_at, updated_at, building_fees(*), rooms(*, room_images(id))";
const LANDLORD_BUILDING_DETAIL_SELECT_FALLBACK =
  "id, landlord_id, name, address, ward, district, city, google_maps_url, description, common_amenities, house_rules, building_drive_folder_url, cover_image_url, public_slug, visibility, created_at, updated_at, building_fees(*), rooms(*, room_images(id))";

function isMissingMapColumnError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "PGRST204" ||
    message.includes("latitude") ||
    message.includes("longitude") ||
    message.includes("formatted_address") ||
    message.includes("google_place_id") ||
    message.includes("zalo_group_name") ||
    message.includes("zalo_group_url")
  );
}

function withMapFieldDefaults<T extends Partial<Building>>(building: T): T & Building {
  return {
    ...building,
    latitude: building.latitude ?? null,
    longitude: building.longitude ?? null,
    formatted_address: building.formatted_address ?? null,
    google_place_id: building.google_place_id ?? null,
    zalo_group_url: building.zalo_group_url ?? null,
    zalo_group_name: building.zalo_group_name ?? null
  } as T & Building;
}

function summarizeBuilding(row: BuildingWithRoomsRow): BuildingSummary {
  const rooms = row.rooms ?? [];

  return {
    ...withMapFieldDefaults(row),
    available_rooms: rooms.filter((room) => room.status === "available").length,
    coming_soon_rooms: rooms.filter((room) => room.status === "coming_soon").length,
    total_rooms: rooms.length
  };
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function firstFee(value: BuildingFee[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : null;
}

export async function getLandlordBuildingSummaries(landlordId: string) {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("buildings")
    .select(LANDLORD_BUILDING_SUMMARY_SELECT)
    .eq("landlord_id", landlordId)
    .order("updated_at", { ascending: false })
    .returns<BuildingWithRoomsRow[]>();

  if (error && isMissingMapColumnError(error)) {
    const fallback = await supabase
      .from("buildings")
      .select(LANDLORD_BUILDING_SUMMARY_SELECT_FALLBACK)
      .eq("landlord_id", landlordId)
      .order("updated_at", { ascending: false })
      .returns<BuildingWithRoomsRow[]>();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(summarizeBuilding);
}

export async function getLandlordDashboard(landlordId: string) {
  const buildings = await getLandlordBuildingSummaries(landlordId);

  return {
    available_rooms: buildings.reduce((total, building) => total + building.available_rooms, 0),
    buildings,
    coming_soon_rooms: buildings.reduce(
      (total, building) => total + building.coming_soon_rooms,
      0
    ),
    total_buildings: buildings.length,
    total_rooms: buildings.reduce((total, building) => total + building.total_rooms, 0)
  };
}

export async function getLandlordBuildingDetail(buildingId: string, landlordId: string) {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("buildings")
    .select(LANDLORD_BUILDING_DETAIL_SELECT)
    .eq("id", buildingId)
    .eq("landlord_id", landlordId)
    .maybeSingle<BuildingDetailRow>();

  if (error && isMissingMapColumnError(error)) {
    const fallback = await supabase
      .from("buildings")
      .select(LANDLORD_BUILDING_DETAIL_SELECT_FALLBACK)
      .eq("id", buildingId)
      .eq("landlord_id", landlordId)
      .maybeSingle<BuildingDetailRow>();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const rooms = (data.rooms ?? []).map(({ room_images, ...room }) => ({
    ...room,
    image_count: room_images?.length ?? 0
  })) satisfies RoomListItem[];

  return {
    ...withMapFieldDefaults(data),
    available_rooms: rooms.filter((room) => room.status === "available").length,
    building_fees: firstFee(data.building_fees),
    coming_soon_rooms: rooms.filter((room) => room.status === "coming_soon").length,
    rented_rooms: rooms.filter((room) => room.status === "rented").length,
    rooms: rooms.sort(roomSortCompare),
    total_rooms: rooms.length
  } satisfies BuildingDetail;
}

export async function getLandlordBuilding(buildingId: string, landlordId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("buildings")
    .select("*")
    .eq("id", buildingId)
    .eq("landlord_id", landlordId)
    .maybeSingle<Building>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getLandlordRoom(roomId: string, landlordId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, buildings!inner(*, building_fees(*))")
    .eq("id", roomId)
    .eq("buildings.landlord_id", landlordId)
    .maybeSingle<RoomWithBuildingRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [{ data: fees, error: feesError }, { data: features, error: featuresError }, { data: images, error: imagesError }] =
    await Promise.all([
      supabase.from("room_fees").select("*").eq("room_id", roomId).maybeSingle<RoomFee>(),
      supabase
        .from("room_features")
        .select("*")
        .eq("room_id", roomId)
        .maybeSingle<RoomFeature>(),
      supabase.from("room_images").select("*").eq("room_id", roomId).order("sort_order").returns<RoomImage[]>()
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

  const signedImages = await Promise.all(
    (images ?? []).map(async (image) => {
      if (image.source_type !== "uploaded" || !image.storage_path) {
        return image;
      }

      const { data: signed } = await supabase.storage
        .from("room-images")
        .createSignedUrl(image.storage_path, 60 * 60);

      return {
        ...image,
        image_url: signed?.signedUrl ?? image.image_url
      };
    })
  );

  const { buildings, ...room } = data;
  const buildingRelation = firstRelation(buildings);
  const { building_fees: buildingFeesRows, ...building } = buildingRelation!;
  const buildingFees = firstFee(buildingFeesRows);

  return {
    ...room,
    building: withMapFieldDefaults(building),
    building_fees: buildingFees,
    effective_fees: room.fee_mode === "room_override" ? fees ?? null : buildingFees,
    features: features ?? null,
    fees: fees ?? null,
    images: signedImages
  } satisfies RoomWithBuilding;
}

export async function getLandlordSellList(landlordId: string, buildingId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("rooms")
    .select("*, buildings!inner(*)")
    .eq("buildings.landlord_id", landlordId)
    .in("status", ["available", "coming_soon"])
    .order("updated_at", { ascending: false });

  if (buildingId) {
    query = query.eq("building_id", buildingId);
  }

  const { data, error } = await query.returns<Array<Room & { buildings: Building | Building[] }>>();

  if (error) {
    throw new Error(error.message);
  }

  const groups = new Map<string, SellListGroup>();
  const rows = data ?? [];
  const roomRefs = rows.map((row) => {
    const building = firstRelation(row.buildings);
    return { building_id: building?.id ?? row.building_id, room_id: row.id };
  });
  const [lastEvents, pendingCloseRequests] = await Promise.all([
    getLatestSellEventsByRoom(landlordId, roomRefs),
    getPendingCloseRequestsByRoom(
      landlordId,
      rows.map((row) => row.id)
    )
  ]);

  for (const row of rows) {
    const { buildings, ...room } = row;
    const building = firstRelation(buildings);

    if (!building) {
      continue;
    }

    const existing = groups.get(building.id) ?? { building, rooms: [] };
    existing.rooms.push({
      ...room,
      building,
      building_fees: null,
      effective_fees: null,
      fees: null,
      features: null,
      images: [],
      last_sell_event_at: lastEvents.get(room.id) ?? null,
      pending_close_request: pendingCloseRequests.get(room.id) ?? null
    });
    groups.set(building.id, existing);
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    rooms: group.rooms.sort(roomSortCompare)
  }));
}

export async function getLandlordSellDashboard(landlordId: string): Promise<SellListDashboard> {
  const groups = await getLandlordSellList(landlordId);
  const recentlyClosed = await getRecentlyClosedSellRooms(landlordId);

  return {
    groups,
    recently_closed: recentlyClosed
  };
}

async function getLatestSellEventsByRoom(
  landlordId: string,
  roomRefs: Array<{ room_id: string; building_id: string }>
) {
  const latest = new Map<string, string>();

  if (roomRefs.length === 0) {
    return latest;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_sell_events")
    .select("*")
    .eq("landlord_id", landlordId)
    .in("event_type", ["share_landlord", "share_building", "share_room"])
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<RoomSellEvent[]>();

  if (error) {
    if (isMissingSellEventsTableError(error)) {
      return latest;
    }

    throw new Error(error.message);
  }

  for (const ref of roomRefs) {
    const event = (data ?? []).find(
      (item) =>
        item.room_id === ref.room_id ||
        item.building_id === ref.building_id ||
        item.event_type === "share_landlord"
    );

    if (event) {
      latest.set(ref.room_id, event.created_at);
    }
  }

  return latest;
}

async function getPendingCloseRequestsByRoom(landlordId: string, roomIds: string[]) {
  const pending = new Map<string, LandlordRoomCloseRequest>();
  const uniqueRoomIds = Array.from(new Set(roomIds));

  if (uniqueRoomIds.length === 0) {
    return pending;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_close_requests")
    .select(
      "id, room_id, broker_id, landlord_id, status, broker_note, landlord_note, created_at, updated_at, resolved_at, resolved_by, broker:profiles!room_close_requests_broker_id_fkey(id, full_name, phone)"
    )
    .eq("landlord_id", landlordId)
    .eq("status", "pending")
    .in("room_id", uniqueRoomIds)
    .order("created_at", { ascending: false })
    .returns<LandlordRoomCloseRequestRow[]>();

  if (error) {
    if (isMissingRoomCloseRequestsTableError(error)) {
      return pending;
    }

    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    if (pending.has(row.room_id)) {
      continue;
    }

    const { broker, ...request } = row;
    pending.set(row.room_id, {
      ...request,
      broker: firstRelation(broker)
    });
  }

  return pending;
}

async function getRecentlyClosedSellRooms(landlordId: string): Promise<SellListClosedRoom[]> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_status_logs")
    .select("created_at, rooms!inner(*, buildings!inner(*))")
    .in("old_status", ["available", "coming_soon"])
    .eq("new_status", "rented")
    .gte("created_at", cutoff)
    .eq("rooms.buildings.landlord_id", landlordId)
    .order("created_at", { ascending: false })
    .returns<Array<{ created_at: string; rooms: (Room & { buildings: Building | Building[] }) | Array<Room & { buildings: Building | Building[] }> }>>();

  if (!error) {
    const rows = (data ?? []).flatMap((log) => {
      const room = firstRelation(log.rooms);
      const building = firstRelation(room?.buildings);

      if (!room || !building) {
        return [];
      }

      const { buildings: _buildings, ...roomData } = room;
      return [
        {
          ...roomData,
          building: withMapFieldDefaults(building),
          building_fees: null,
          closed_at: log.created_at,
          closed_from_log: true,
          effective_fees: null,
          fees: null,
          features: null,
          images: [],
          last_sell_event_at: null,
          pending_close_request: null
        } satisfies SellListClosedRoom
      ];
    });
    return hydrateClosedRoomEvents(landlordId, rows);
  }

  // Fallback for environments where the room_status_logs relation cannot be queried through PostgREST.
  const fallback = await supabase
    .from("rooms")
    .select("*, buildings!inner(*)")
    .eq("status", "rented")
    .gte("updated_at", cutoff)
    .eq("buildings.landlord_id", landlordId)
    .order("updated_at", { ascending: false })
    .returns<Array<Room & { buildings: Building | Building[] }>>();

  if (fallback.error) {
    throw new Error(fallback.error.message);
  }

  const rows = (fallback.data ?? []).flatMap((row) => {
    const { buildings, ...room } = row;
    const building = firstRelation(buildings);

    if (!building) {
      return [];
    }

    return [
      {
        ...room,
        building: withMapFieldDefaults(building),
        building_fees: null,
        closed_at: row.updated_at,
        closed_from_log: false,
        effective_fees: null,
        fees: null,
        features: null,
        images: [],
        last_sell_event_at: null,
        pending_close_request: null
      } satisfies SellListClosedRoom
    ];
  });

  return hydrateClosedRoomEvents(landlordId, rows);
}

async function hydrateClosedRoomEvents(landlordId: string, rooms: SellListClosedRoom[]) {
  const lastEvents = await getLatestSellEventsByRoom(
    landlordId,
    rooms.map((room) => ({ building_id: room.building.id, room_id: room.id }))
  );

  return rooms.map((room) => ({
    ...room,
    last_sell_event_at: lastEvents.get(room.id) ?? null
  }));
}

function isMissingSellEventsTableError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("room_sell_events") ||
    message.includes("schema cache")
  );
}

function isMissingRoomCloseRequestsTableError(error: { message?: string; code?: string }) {
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

export function isRoomStatus(value: string): value is RoomStatus {
  return ["available", "coming_soon", "reserved", "rented", "hidden"].includes(value);
}
