import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

const SELLABLE_ROOM_STATUSES = ["available", "coming_soon"] as const;

export type ShareRoomsRoom = {
  id: string;
  room_code: string | null;
  title: string | null;
  rent_price: number | string | null;
  deposit_amount: number | string | null;
  area_m2: number | string | null;
  status: string | null;
  visibility?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ShareRoomsBuilding = {
  id: string;
  name: string;
  district: string | null;
  rooms: ShareRoomsRoom[];
};

export type ShareRoomsData = {
  landlord: {
    id: string;
    full_name: string | null;
    public_slug: string | null;
  };
  buildings: ShareRoomsBuilding[];
  primaryBuilding: ShareRoomsBuilding | null;
  brokerPath: string;
};

type BuildingRow = {
  id: string;
  name: string;
  district: string | null;
  rooms: ShareRoomsRoom[] | null;
};

export async function getShareRoomsData(shareId: string): Promise<ShareRoomsData | null> {
  const decodedShareId = decodeURIComponent(shareId).trim();

  if (!decodedShareId) {
    return null;
  }

  const supabase = await createClient();
  const landlordId = shareIdToLandlordId(decodedShareId);
  const landlordQuery = supabase
    .from("profiles")
    .select("id, full_name, public_slug")
    .eq("role", "landlord")
    .eq("status", "active")
    .limit(1);

  const { data: landlord, error: landlordError } = landlordId
    ? await landlordQuery.eq("id", landlordId).maybeSingle()
    : await landlordQuery.eq("public_slug", decodedShareId).maybeSingle();

  if (landlordError || !landlord) {
    return null;
  }

  const { data: buildingRows, error: buildingsError } = await supabase
    .from("buildings")
    .select(
      "id, name, district, rooms(id, room_code, title, rent_price, deposit_amount, area_m2, status, visibility, created_at, updated_at)",
    )
    .eq("landlord_id", landlord.id)
    .eq("visibility", "visible")
    .eq("rooms.visibility", "visible")
    .in("rooms.status", [...SELLABLE_ROOM_STATUSES])
    .order("updated_at", { ascending: false });

  if (buildingsError) {
    return null;
  }

  const buildings = ((buildingRows ?? []) as BuildingRow[])
    .map((building) => ({
      id: building.id,
      name: building.name,
      district: building.district,
      rooms: sortRooms((building.rooms ?? []).filter(Boolean)),
    }))
    .filter((building) => building.rooms.length > 0);
  const primaryBuilding = buildings[0] ?? null;
  const brokerPath = `/broker/rooms?landlord=${encodeURIComponent(landlord.id)}`;

  return {
    landlord,
    buildings,
    primaryBuilding,
    brokerPath,
  };
}

export function getShareSiteUrl() {
  return getSiteUrl();
}

export function getShareRoomsDescription(data: ShareRoomsData | null) {
  const building = data?.primaryBuilding;
  const location = building
    ? [building.name, building.district].filter(Boolean).join(" · ")
    : null;

  return location
    ? `Phòng trống mới cập nhật từ ${location}. Đăng nhập hoặc đăng ký tài khoản môi giới để xem chi tiết.`
    : "Phòng trống mới cập nhật. Đăng nhập hoặc đăng ký tài khoản môi giới để xem chi tiết.";
}

export function getShareIdForLandlord(landlordSlug?: string | null, landlordId?: string | null) {
  const slug = landlordSlug?.trim();

  if (slug) {
    return slug;
  }

  const id = landlordId?.trim();
  return id ? `u-${id.replaceAll("-", "")}` : "";
}

function shareIdToLandlordId(shareId: string) {
  const withoutPrefix = shareId.startsWith("u-") ? shareId.slice(2) : shareId;

  if (isUuid(withoutPrefix)) {
    return withoutPrefix;
  }

  if (/^[a-f0-9]{32}$/i.test(withoutPrefix)) {
    return [
      withoutPrefix.slice(0, 8),
      withoutPrefix.slice(8, 12),
      withoutPrefix.slice(12, 16),
      withoutPrefix.slice(16, 20),
      withoutPrefix.slice(20),
    ].join("-");
  }

  return null;
}

function isUuid(value: string) {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
}

function sortRooms(rooms: ShareRoomsRoom[]) {
  return [...rooms].sort((left, right) => {
    const rightTime = new Date(right.updated_at ?? right.created_at ?? 0).getTime();
    const leftTime = new Date(left.updated_at ?? left.created_at ?? 0).getTime();

    return rightTime - leftTime;
  });
}
