import type { Profile, UserRole, UserStatus } from "@/lib/auth/types";
import type { Building, Room, RoomStatus } from "@/lib/landlord/types";
import type {
  AdminBuildingFilters,
  AdminBuildingRow,
  AdminBuildingsData,
  AdminDashboardMetrics,
  AdminProfileSummary,
  AdminReport,
  AdminReportFilters,
  AdminReportsData,
  AdminRoomFilters,
  AdminRoomRow,
  AdminRoomsData,
  AdminUserFilters,
  AdminUsersData,
  ReportStatus,
  ReportType,
  VisibilityStatus
} from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/server";

type CountTable = "profiles" | "buildings" | "rooms" | "room_reports";
type CountFilter = { column: string; value: string };

type BuildingWithRoomsRow = Building & {
  rooms: Array<Pick<Room, "id" | "status">> | null;
};

type RoomWithBuildingRow = Room & {
  buildings:
    | Pick<
        Building,
        "id" | "landlord_id" | "name" | "address" | "ward" | "district" | "city" | "public_slug"
      >
    | Array<
        Pick<
          Building,
          "id" | "landlord_id" | "name" | "address" | "ward" | "district" | "city" | "public_slug"
        >
      >;
};

type ReportRow = {
  id: string;
  room_id: string;
  broker_id: string;
  report_type: ReportType;
  message: string | null;
  status: ReportStatus;
  admin_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

const userRoles: UserRole[] = ["admin", "landlord", "broker"];
const userStatuses: UserStatus[] = ["pending", "active", "blocked"];
const roomStatuses: RoomStatus[] = ["available", "coming_soon", "reserved", "rented", "hidden"];
const reportStatuses: ReportStatus[] = ["open", "reviewing", "resolved", "rejected"];
const visibilityStatuses: VisibilityStatus[] = ["visible", "hidden"];
const reportTypes: ReportType[] = ["rented", "wrong_price", "wrong_images", "wrong_info", "other"];

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function cleanSearch(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, 80);
}

function safeOrSearch(value: string) {
  return value.replaceAll("%", "\\%").replaceAll(",", " ").trim();
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function includesSearch(haystack: string, needle: string | undefined) {
  if (!needle) {
    return true;
  }

  return normalizeText(haystack).includes(normalizeText(needle));
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])).sort(
    (a, b) => a.localeCompare(b, "vi")
  );
}

function isUserRole(value: string | undefined): value is UserRole {
  return userRoles.includes(value as UserRole);
}

function isUserStatus(value: string | undefined): value is UserStatus {
  return userStatuses.includes(value as UserStatus);
}

function isRoomStatus(value: string | undefined): value is RoomStatus {
  return roomStatuses.includes(value as RoomStatus);
}

function isVisibilityStatus(value: string | undefined): value is VisibilityStatus {
  return visibilityStatuses.includes(value as VisibilityStatus);
}

function isReportStatus(value: string | undefined): value is ReportStatus {
  return reportStatuses.includes(value as ReportStatus);
}

function isReportType(value: string | undefined): value is ReportType {
  return reportTypes.includes(value as ReportType);
}

export function parseAdminUserFilters(searchParams: Record<string, string | string[] | undefined>): AdminUserFilters {
  const role = Array.isArray(searchParams.role) ? searchParams.role[0] : searchParams.role;
  const status = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const q = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;

  return {
    q: cleanSearch(q),
    role: role === "all" || !role ? "all" : isUserRole(role) ? role : "all",
    status: status === "all" || !status ? "all" : isUserStatus(status) ? status : "all"
  };
}

export function parseAdminBuildingFilters(
  searchParams: Record<string, string | string[] | undefined>
): AdminBuildingFilters {
  const visibility = Array.isArray(searchParams.visibility)
    ? searchParams.visibility[0]
    : searchParams.visibility;
  const q = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const district = Array.isArray(searchParams.district) ? searchParams.district[0] : searchParams.district;
  const landlord = Array.isArray(searchParams.landlord) ? searchParams.landlord[0] : searchParams.landlord;

  return {
    district: cleanSearch(district),
    landlord: cleanSearch(landlord),
    q: cleanSearch(q),
    visibility:
      visibility === "all" || !visibility ? "all" : isVisibilityStatus(visibility) ? visibility : "all"
  };
}

export function parseAdminRoomFilters(searchParams: Record<string, string | string[] | undefined>): AdminRoomFilters {
  const status = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const visibility = Array.isArray(searchParams.visibility)
    ? searchParams.visibility[0]
    : searchParams.visibility;
  const q = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const district = Array.isArray(searchParams.district) ? searchParams.district[0] : searchParams.district;
  const minPrice = Array.isArray(searchParams.minPrice) ? searchParams.minPrice[0] : searchParams.minPrice;
  const maxPrice = Array.isArray(searchParams.maxPrice) ? searchParams.maxPrice[0] : searchParams.maxPrice;

  return {
    district: cleanSearch(district),
    maxPrice: parsePositiveNumber(maxPrice),
    minPrice: parsePositiveNumber(minPrice),
    q: cleanSearch(q),
    status: status === "all" || !status ? "all" : isRoomStatus(status) ? status : "all",
    visibility:
      visibility === "all" || !visibility ? "all" : isVisibilityStatus(visibility) ? visibility : "all"
  };
}

export function parseAdminReportFilters(
  searchParams: Record<string, string | string[] | undefined>
): AdminReportFilters {
  const status = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const reportType = Array.isArray(searchParams.reportType)
    ? searchParams.reportType[0]
    : searchParams.reportType;
  const q = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;

  return {
    q: cleanSearch(q),
    reportType: reportType === "all" || !reportType ? "all" : isReportType(reportType) ? reportType : "all",
    status: status === "all" || !status ? "all" : isReportStatus(status) ? status : "all"
  };
}

function parsePositiveNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

async function countRows(table: CountTable, filters: CountFilter[] = []) {
  const supabase = await createClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const [
    totalUsers,
    adminUsers,
    landlordUsers,
    brokerUsers,
    pendingUsers,
    activeUsers,
    blockedUsers,
    totalBuildings,
    visibleBuildings,
    hiddenBuildings,
    totalRooms,
    availableRooms,
    comingSoonRooms,
    reservedRooms,
    rentedRooms,
    hiddenRooms,
    totalReports,
    openReports,
    reviewingReports,
    resolvedReports,
    rejectedReports
  ] = await Promise.all([
    countRows("profiles"),
    countRows("profiles", [{ column: "role", value: "admin" }]),
    countRows("profiles", [{ column: "role", value: "landlord" }]),
    countRows("profiles", [{ column: "role", value: "broker" }]),
    countRows("profiles", [{ column: "status", value: "pending" }]),
    countRows("profiles", [{ column: "status", value: "active" }]),
    countRows("profiles", [{ column: "status", value: "blocked" }]),
    countRows("buildings"),
    countRows("buildings", [{ column: "visibility", value: "visible" }]),
    countRows("buildings", [{ column: "visibility", value: "hidden" }]),
    countRows("rooms"),
    countRows("rooms", [{ column: "status", value: "available" }]),
    countRows("rooms", [{ column: "status", value: "coming_soon" }]),
    countRows("rooms", [{ column: "status", value: "reserved" }]),
    countRows("rooms", [{ column: "status", value: "rented" }]),
    countRows("rooms", [{ column: "status", value: "hidden" }]),
    countRows("room_reports"),
    countRows("room_reports", [{ column: "status", value: "open" }]),
    countRows("room_reports", [{ column: "status", value: "reviewing" }]),
    countRows("room_reports", [{ column: "status", value: "resolved" }]),
    countRows("room_reports", [{ column: "status", value: "rejected" }])
  ]);

  return {
    buildings: {
      byVisibility: { hidden: hiddenBuildings, visible: visibleBuildings },
      total: totalBuildings
    },
    reports: {
      byStatus: {
        open: openReports,
        rejected: rejectedReports,
        resolved: resolvedReports,
        reviewing: reviewingReports
      },
      total: totalReports
    },
    rooms: {
      byStatus: {
        available: availableRooms,
        coming_soon: comingSoonRooms,
        hidden: hiddenRooms,
        rented: rentedRooms,
        reserved: reservedRooms
      },
      total: totalRooms
    },
    users: {
      byRole: { admin: adminUsers, broker: brokerUsers, landlord: landlordUsers },
      byStatus: { active: activeUsers, blocked: blockedUsers, pending: pendingUsers },
      total: totalUsers
    }
  };
}

export async function getAdminUsers(filters: AdminUserFilters): Promise<AdminUsersData> {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .limit(200);

  if (filters.role && filters.role !== "all") {
    query = query.eq("role", filters.role);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.q) {
    const search = safeOrSearch(filters.q);
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { count, data, error } = await query.returns<Profile[]>();

  if (error) {
    throw new Error(error.message);
  }

  return {
    count: count ?? data?.length ?? 0,
    filters,
    users: data ?? []
  };
}

async function getProfilesById(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return new Map<string, AdminProfileSummary>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, email, role, status")
    .in("id", uniqueIds)
    .returns<AdminProfileSummary[]>();

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

function toAdminBuilding(row: BuildingWithRoomsRow, landlords: Map<string, AdminProfileSummary>): AdminBuildingRow {
  const rooms = row.rooms ?? [];

  return {
    ...row,
    available_rooms: rooms.filter((room) => room.status === "available").length,
    coming_soon_rooms: rooms.filter((room) => room.status === "coming_soon").length,
    landlord: landlords.get(row.landlord_id) ?? null,
    total_rooms: rooms.length
  };
}

export async function getAdminBuildings(filters: AdminBuildingFilters): Promise<AdminBuildingsData> {
  const supabase = await createClient();
  let query = supabase
    .from("buildings")
    .select(
      "id, landlord_id, name, address, ward, district, city, google_maps_url, description, common_amenities, house_rules, building_drive_folder_url, cover_image_url, public_slug, visibility, created_at, updated_at, rooms(id, status)",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .limit(250);

  if (filters.visibility && filters.visibility !== "all") {
    query = query.eq("visibility", filters.visibility);
  }

  if (filters.district) {
    query = query.eq("district", filters.district);
  }

  const { count, data, error } = await query.returns<BuildingWithRoomsRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const landlords = await getProfilesById(rows.map((row) => row.landlord_id));
  const buildings = rows
    .map((row) => toAdminBuilding(row, landlords))
    .filter((building) =>
      includesSearch(
        [
          building.name,
          building.address,
          building.ward,
          building.district,
          building.city,
          building.landlord?.full_name,
          building.landlord?.phone,
          building.landlord?.email
        ].join(" "),
        filters.q
      )
    )
    .filter((building) =>
      includesSearch(
        [building.landlord?.full_name, building.landlord?.phone, building.landlord?.email].join(" "),
        filters.landlord
      )
    );

  return {
    buildings,
    count: count ?? rows.length,
    districts: uniqueSorted(rows.map((row) => row.district)),
    filters
  };
}

async function getAdminRoomsByIds(roomIds: string[]) {
  const uniqueRoomIds = Array.from(new Set(roomIds.filter(Boolean)));

  if (uniqueRoomIds.length === 0) {
    return new Map<string, AdminRoomRow>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "*, buildings!inner(id, landlord_id, name, address, ward, district, city, public_slug)"
    )
    .in("id", uniqueRoomIds)
    .returns<RoomWithBuildingRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const rooms = await normalizeAdminRooms(data ?? []);
  return new Map(rooms.map((room) => [room.id, room]));
}

async function normalizeAdminRooms(rows: RoomWithBuildingRow[]) {
  const landlordIds = rows
    .map((row) => firstRelation(row.buildings)?.landlord_id)
    .filter((value): value is string => Boolean(value));
  const landlords = await getProfilesById(landlordIds);

  return rows.map((row) => {
    const { buildings, ...room } = row;
    const building = firstRelation(buildings);

    return {
      ...room,
      building,
      landlord: building ? landlords.get(building.landlord_id) ?? null : null
    } satisfies AdminRoomRow;
  });
}

export async function getAdminRooms(filters: AdminRoomFilters): Promise<AdminRoomsData> {
  const supabase = await createClient();
  let query = supabase
    .from("rooms")
    .select("*, buildings!inner(id, landlord_id, name, address, ward, district, city, public_slug)", {
      count: "exact"
    })
    .order("updated_at", { ascending: false })
    .limit(300);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.visibility && filters.visibility !== "all") {
    query = query.eq("visibility", filters.visibility);
  }

  if (filters.district) {
    query = query.eq("buildings.district", filters.district);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte("rent_price", filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte("rent_price", filters.maxPrice);
  }

  const { count, data, error } = await query.returns<RoomWithBuildingRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const rooms = (await normalizeAdminRooms(rows)).filter((room) =>
    includesSearch(
      [
        room.room_code,
        room.title,
        room.building?.name,
        room.building?.address,
        room.building?.ward,
        room.building?.district,
        room.landlord?.full_name,
        room.landlord?.phone,
        room.landlord?.email
      ].join(" "),
      filters.q
    )
  );

  return {
    count: count ?? rows.length,
    districts: uniqueSorted(rows.map((row) => firstRelation(row.buildings)?.district)),
    filters,
    rooms
  };
}

export async function getAdminReports(filters: AdminReportFilters): Promise<AdminReportsData> {
  const supabase = await createClient();
  let query = supabase
    .from("room_reports")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .limit(250);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.reportType && filters.reportType !== "all") {
    query = query.eq("report_type", filters.reportType);
  }

  const { count, data, error } = await query.returns<ReportRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const [roomsById, profilesById] = await Promise.all([
    getAdminRoomsByIds(rows.map((report) => report.room_id)),
    getProfilesById(
      rows.flatMap((report) => [report.broker_id, report.resolved_by].filter((id): id is string => Boolean(id)))
    )
  ]);

  const reports: AdminReport[] = rows
    .map((report) => {
      const room = roomsById.get(report.room_id) ?? null;
      return {
        ...report,
        broker: profilesById.get(report.broker_id) ?? null,
        resolved_by_admin: report.resolved_by ? profilesById.get(report.resolved_by) ?? null : null,
        room
      };
    })
    .filter((report) =>
      includesSearch(
        [
          report.message,
          report.admin_note,
          report.room?.room_code,
          report.room?.title,
          report.room?.building?.name,
          report.room?.building?.address,
          report.room?.landlord?.full_name,
          report.broker?.full_name,
          report.broker?.phone,
          report.broker?.email
        ].join(" "),
        filters.q
      )
    );

  return {
    count: count ?? rows.length,
    filters,
    reports
  };
}
