import type { UserRole, UserStatus } from "@/lib/auth/types";
import type { RoomStatus } from "@/lib/landlord/types";
import type { ReportStatus, ReportType, VisibilityStatus } from "@/lib/admin/types";

export const adminRoleLabels: Record<UserRole, string> = {
  admin: "Admin",
  broker: "Môi giới",
  landlord: "Chủ nhà"
};

export const adminUserStatusLabels: Record<UserStatus, string> = {
  active: "Đang hoạt động",
  blocked: "Đã khóa",
  pending: "Chờ duyệt"
};

export const adminRoomStatusLabels: Record<RoomStatus, string> = {
  available: "Đang trống",
  coming_soon: "Sắp trống",
  reserved: "Đang giữ cọc",
  rented: "Đã thuê",
  hidden: "Tạm ẩn"
};

export const adminVisibilityLabels: Record<VisibilityStatus, string> = {
  hidden: "Đã ẩn",
  visible: "Hiển thị"
};

export const adminReportTypeLabels: Record<ReportType, string> = {
  other: "Khác",
  rented: "Phòng đã thuê",
  wrong_images: "Sai ảnh",
  wrong_info: "Sai thông tin",
  wrong_price: "Sai giá"
};

export const adminReportStatusLabels: Record<ReportStatus, string> = {
  open: "Mới",
  rejected: "Từ chối",
  resolved: "Đã xử lý",
  reviewing: "Đang xử lý"
};
