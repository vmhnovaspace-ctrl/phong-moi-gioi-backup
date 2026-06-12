import { roomSortCompare } from "@/lib/landlord/format";
import type { BuildingFee, RoomFeature, RoomFee, RoomStatus } from "@/lib/landlord/types";
import { createClient } from "@/lib/supabase/server";
import type {
  BuildingSharePageData,
  LandlordSharePageData,
  RoomSharePageData,
  ShareBuilding,
  ShareImage,
  ShareLandlord,
  ShareRoom
} from "@/lib/share/types";

const SELLABLE_STATUSES = ["available", "coming_soon"] satisfies RoomStatus[];

const SHARE_IMAGE_SELECT =
  "id, image_url, storage_path, source_type, image_type, sort_order, is_cover, created_at";

const SHARE_ROOM_SELECT = [
  "id",
  "building_id",
  "room_code",
  "title",
  "floor",
  "area_m2",
  "rent_price",
  "deposit_amount",
  "max_people",
  "status",
  "available_from",
  "commission",
  "min_lease_months",
  "fee_mode",
  "room_layouts",
  "description",
  "strengths",
  "weaknesses",
  "room_drive_folder_url",
  "cover_image_url",
  "public_slug",
  "visibility",
  "updated_at",
  "room_fees(*)",
  "room_features(*)",
  `room_images(${SHARE_IMAGE_SELECT})`
].join(", ");

const SHARE_BUILDING_BASE_SELECT = [
  "id",
  "landlord_id",
  "name",
  "address",
  "ward",
  "district",
  "city",
  "description",
  "common_amenities",
  "house_rules",
  "building_drive_folder_url",
  "cover_image_url",
  "public_slug",
  "visibility",
  "updated_at",
  "building_fees(*)",
  `building_images(${SHARE_IMAGE_SELECT})`
].join(", ");

const SHARE_BUILDING_SELECT = [
  SHARE_BUILDING_BASE_SELECT,
  `rooms(${SHARE_ROOM_SELECT})`
].join(", ");

const SHARE_ROOM_DETAIL_SELECT = [
  SHARE_ROOM_SELECT,
  `buildings!inner(${SHARE_BUILDING_BASE_SELECT})`
].join(", ");

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ShareImageRow = ShareImage;

type ShareRoomRow = Omit<ShareRoom, "fees" | "effective_fees" | "features" | "images"> & {
  room_fees: RoomFee[] | RoomFee | null;
  room_features: RoomFeature[] | RoomFeature | null;
  room_images: ShareImageRow[] | null;
};

type ShareBuildingRow = Omit<
  ShareBuilding,
  "available_rooms" | "building_fees" | "coming_soon_rooms" | "images" | "rooms"
> & {
  building_fees: BuildingFee[] | BuildingFee | null;
  building_images: ShareImageRow[] | null;
  rooms?: ShareRoomRow[] | null;
};

type ShareRoomDetailRow = ShareRoomRow & {
  buildings: ShareBuildingRow | ShareBuildingRow[] | null;
};

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

function isSellableRoom(room: Pick<ShareRoomRow, "status" | "visibility">) {
  return room.visibility === "visible" && (SELLABLE_STATUSES as RoomStatus[]).includes(room.status);
}

async function signImage(supabase: SupabaseServerClient, image: ShareImageRow): Promise<ShareImage> {
  if (image.source_type !== "uploaded" || !image.storage_path) {
    return image;
  }

  const { data } = await supabase.storage
    .from("room-images")
    .createSignedUrl(image.storage_path, 60 * 60);

  return {
    ...image,
    image_url: data?.signedUrl ?? image.image_url
  };
}

async function signImages(supabase: SupabaseServerClient, images: ShareImageRow[] | null | undefined) {
  const sorted = [...(images ?? [])].sort((a, b) => {
    if (a.is_cover !== b.is_cover) {
      return a.is_cover ? -1 : 1;
    }

    return a.sort_order - b.sort_order;
  });

  return Promise.all(sorted.map((image) => signImage(supabase, image)));
}

async function normalizeRoom(
  supabase: SupabaseServerClient,
  row: ShareRoomRow,
  buildingFees: BuildingFee | null
): Promise<ShareRoom> {
  const { room_fees: feeRows, room_features: featureRows, room_images: imageRows, ...room } = row;
  const fees = firstRelation(feeRows);
  const features = latestRelation(featureRows);

  return {
    ...room,
    effective_fees: room.fee_mode === "room_override" ? fees : buildingFees,
    fees,
    features,
    images: await signImages(supabase, imageRows)
  };
}

async function normalizeBuilding(
  supabase: SupabaseServerClient,
  row: ShareBuildingRow
): Promise<ShareBuilding> {
  const {
    building_fees: buildingFeeRows,
    building_images: buildingImageRows,
    rooms: roomRows,
    ...building
  } = row;
  const buildingFees = firstRelation(buildingFeeRows);
  const rooms = (
    await Promise.all(
      (roomRows ?? [])
        .filter(isSellableRoom)
        .map((room) => normalizeRoom(supabase, room, buildingFees))
    )
  ).sort(roomSortCompare);

  return {
    ...building,
    available_rooms: rooms.filter((room) => room.status === "available").length,
    building_fees: buildingFees,
    coming_soon_rooms: rooms.filter((room) => room.status === "coming_soon").length,
    images: await signImages(supabase, buildingImageRows),
    rooms
  };
}

async function getLandlordById(supabase: SupabaseServerClient, landlordId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, public_slug")
    .eq("id", landlordId)
    .eq("role", "landlord")
    .eq("status", "active")
    .maybeSingle<ShareLandlord>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getLandlordSharePageData(
  landlordSlug: string
): Promise<LandlordSharePageData | null> {
  const supabase = await createClient();
  const { data: landlord, error: landlordError } = await supabase
    .from("profiles")
    .select("id, full_name, public_slug")
    .eq("public_slug", landlordSlug)
    .eq("role", "landlord")
    .eq("status", "active")
    .maybeSingle<ShareLandlord>();

  if (landlordError) {
    throw new Error(landlordError.message);
  }

  if (!landlord) {
    return null;
  }

  const { data, error } = await supabase
    .from("buildings")
    .select(SHARE_BUILDING_SELECT)
    .eq("landlord_id", landlord.id)
    .eq("visibility", "visible")
    .eq("rooms.visibility", "visible")
    .in("rooms.status", SELLABLE_STATUSES)
    .order("updated_at", { ascending: false })
    .returns<ShareBuildingRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const buildings = await Promise.all((data ?? []).map((row) => normalizeBuilding(supabase, row)));

  return {
    available_rooms: buildings.reduce((total, building) => total + building.available_rooms, 0),
    buildings,
    coming_soon_rooms: buildings.reduce((total, building) => total + building.coming_soon_rooms, 0),
    landlord,
    total_sellable_rooms: buildings.reduce((total, building) => total + building.rooms.length, 0),
    visible_buildings: buildings.length
  };
}

export async function getBuildingSharePageData(
  buildingSlug: string
): Promise<BuildingSharePageData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("buildings")
    .select(SHARE_BUILDING_SELECT)
    .eq("public_slug", buildingSlug)
    .eq("visibility", "visible")
    .eq("rooms.visibility", "visible")
    .in("rooms.status", SELLABLE_STATUSES)
    .maybeSingle<ShareBuildingRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [building, landlord] = await Promise.all([
    normalizeBuilding(supabase, data),
    getLandlordById(supabase, data.landlord_id)
  ]);

  return { building, landlord };
}

export async function getRoomSharePageData(roomSlug: string): Promise<RoomSharePageData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(SHARE_ROOM_DETAIL_SELECT)
    .eq("public_slug", roomSlug)
    .maybeSingle<ShareRoomDetailRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const buildingRow = firstRelation(data.buildings);

  if (!buildingRow) {
    return null;
  }

  if (!isSellableRoom(data) || buildingRow.visibility !== "visible") {
    return { unavailable: true };
  }

  const building = await normalizeBuilding(supabase, {
    ...buildingRow,
    rooms: []
  });
  const [room, landlord] = await Promise.all([
    normalizeRoom(supabase, data, building.building_fees),
    getLandlordById(supabase, building.landlord_id)
  ]);

  return {
    building,
    landlord,
    room,
    unavailable: false
  };
}
