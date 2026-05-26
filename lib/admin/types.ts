import type { Profile, UserRole, UserStatus } from "@/lib/auth/types";
import type { Building, Room, RoomStatus } from "@/lib/landlord/types";

export type VisibilityStatus = "visible" | "hidden";
export type ReportType = "rented" | "wrong_price" | "wrong_images" | "wrong_info" | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "rejected";

export type AdminActionResult = {
  error?: string;
  message?: string;
};

export type AdminDashboardMetrics = {
  users: {
    total: number;
    byRole: Record<UserRole, number>;
    byStatus: Record<UserStatus, number>;
  };
  buildings: {
    total: number;
    byVisibility: Record<VisibilityStatus, number>;
  };
  rooms: {
    total: number;
    byStatus: Record<RoomStatus, number>;
  };
  reports: {
    total: number;
    byStatus: Record<ReportStatus, number>;
  };
};

export type AdminUserFilters = {
  q?: string;
  role?: UserRole | "all";
  status?: UserStatus | "all";
};

export type AdminUsersData = {
  count: number;
  filters: AdminUserFilters;
  users: Profile[];
};

export type AdminProfileSummary = Pick<
  Profile,
  "id" | "full_name" | "phone" | "email" | "role" | "status"
>;

export type AdminBuildingRow = Building & {
  landlord: AdminProfileSummary | null;
  total_rooms: number;
  available_rooms: number;
  coming_soon_rooms: number;
};

export type AdminBuildingFilters = {
  q?: string;
  district?: string;
  visibility?: VisibilityStatus | "all";
  landlord?: string;
};

export type AdminBuildingsData = {
  buildings: AdminBuildingRow[];
  count: number;
  districts: string[];
  filters: AdminBuildingFilters;
};

export type AdminRoomRow = Room & {
  building: Pick<
    Building,
    "id" | "landlord_id" | "name" | "address" | "ward" | "district" | "city" | "public_slug"
  > | null;
  landlord: AdminProfileSummary | null;
};

export type AdminRoomFilters = {
  q?: string;
  status?: RoomStatus | "all";
  visibility?: VisibilityStatus | "all";
  district?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type AdminRoomsData = {
  count: number;
  districts: string[];
  filters: AdminRoomFilters;
  rooms: AdminRoomRow[];
};

export type AdminReport = {
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
  room: AdminRoomRow | null;
  broker: AdminProfileSummary | null;
  resolved_by_admin: AdminProfileSummary | null;
};

export type AdminReportFilters = {
  q?: string;
  reportType?: ReportType | "all";
  status?: ReportStatus | "all";
};

export type AdminReportsData = {
  count: number;
  filters: AdminReportFilters;
  reports: AdminReport[];
};
