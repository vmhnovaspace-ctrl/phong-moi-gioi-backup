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

type PublicLandlordShareRpcResult = {
  landlord: ShareLandlord;
  buildings: ShareBuildingRow[];
};

type PublicBuildingShareRpcResult = {
  landlord: ShareLandlord | null;
  building: ShareBuildingRow;
};

type PublicRoomShareRpcResult =
  | {
      unavailable: true;
    }
  | {
      unavailable: false;
      landlord: ShareLandlord | null;
      building: ShareBuildingRow;
      room: ShareRoomRow;
    };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRpcResult<T>(value: unknown): T | null {
  return isObject(value) ? (value as T) : null;
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

export async function getLandlordSharePageData(
  landlordSlug: string
): Promise<LandlordSharePageData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_landlord_share", {
    landlord_slug: landlordSlug
  });

  if (error) {
    throw new Error(error.message);
  }

  const parsed = parseRpcResult<PublicLandlordShareRpcResult>(data);

  if (!parsed) {
    return null;
  }

  const buildings = await Promise.all(
    (parsed.buildings ?? []).map((row) => normalizeBuilding(supabase, row))
  );

  return {
    available_rooms: buildings.reduce((total, building) => total + building.available_rooms, 0),
    buildings,
    coming_soon_rooms: buildings.reduce((total, building) => total + building.coming_soon_rooms, 0),
    landlord: parsed.landlord,
    total_sellable_rooms: buildings.reduce((total, building) => total + building.rooms.length, 0),
    visible_buildings: buildings.length
  };
}

export async function getBuildingSharePageData(
  buildingSlug: string
): Promise<BuildingSharePageData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_building_share", {
    building_slug: buildingSlug
  });

  if (error) {
    throw new Error(error.message);
  }

  const parsed = parseRpcResult<PublicBuildingShareRpcResult>(data);

  if (!parsed) {
    return null;
  }

  const building = await normalizeBuilding(supabase, parsed.building);

  return { building, landlord: parsed.landlord };
}

export async function getRoomSharePageData(roomSlug: string): Promise<RoomSharePageData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_room_share", {
    room_slug: roomSlug
  });

  if (error) {
    throw new Error(error.message);
  }

  const parsed = parseRpcResult<PublicRoomShareRpcResult>(data);

  if (!parsed) {
    return null;
  }

  if (parsed.unavailable) {
    return { unavailable: true };
  }

  if (!isSellableRoom(parsed.room) || parsed.building.visibility !== "visible") {
    return { unavailable: true };
  }

  const building = await normalizeBuilding(supabase, parsed.building);
  const room = await normalizeRoom(supabase, parsed.room, building.building_fees);

  return {
    building,
    landlord: parsed.landlord,
    room,
    unavailable: false
  };
}
