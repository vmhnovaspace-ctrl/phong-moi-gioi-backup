"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/profile";
import type {
  AdminActionResult,
  ReportStatus,
  VisibilityStatus
} from "@/lib/admin/types";
import type { UserStatus } from "@/lib/auth/types";
import type { RoomStatus } from "@/lib/landlord/types";
import { createClient } from "@/lib/supabase/server";

const userStatuses: UserStatus[] = ["pending", "active", "blocked"];
const reportStatuses: ReportStatus[] = ["open", "reviewing", "resolved", "rejected"];
const visibilityStatuses: VisibilityStatus[] = ["visible", "hidden"];
const roomStatuses: RoomStatus[] = ["available", "coming_soon", "reserved", "rented", "hidden"];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function isUserStatus(value: string): value is UserStatus {
  return userStatuses.includes(value as UserStatus);
}

function isReportStatus(value: string): value is ReportStatus {
  return reportStatuses.includes(value as ReportStatus);
}

function isVisibilityStatus(value: string): value is VisibilityStatus {
  return visibilityStatuses.includes(value as VisibilityStatus);
}

function isRoomStatus(value: string): value is RoomStatus {
  return roomStatuses.includes(value as RoomStatus);
}

function adminMessagePath(path: string, result: AdminActionResult) {
  const params = new URLSearchParams();

  if (result.error) {
    params.set("error", result.error);
  } else if (result.message) {
    params.set("message", result.message);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function revalidateAdminPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/buildings");
  revalidatePath("/admin/rooms");
  revalidatePath("/admin/reports");
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus
): Promise<AdminActionResult> {
  const profile = await requireRole(["admin"]);

  if (!userId || !isUserStatus(status)) {
    return { error: "Trạng thái user không hợp lệ." };
  }

  if (userId === profile.id && status !== "active") {
    return { error: "Admin không thể tự khóa hoặc chuyển chính mình khỏi trạng thái active." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminPaths();
  return { message: "Đã cập nhật trạng thái user." };
}

export async function approveUser(userId: string) {
  return updateUserStatus(userId, "active");
}

export async function blockUser(userId: string) {
  return updateUserStatus(userId, "blocked");
}

export async function unblockUser(userId: string) {
  return updateUserStatus(userId, "active");
}

export async function updateUserStatusFormAction(formData: FormData) {
  const userId = getString(formData, "user_id");
  const status = getString(formData, "status");
  const result = isUserStatus(status)
    ? await updateUserStatus(userId, status)
    : { error: "Trạng thái user không hợp lệ." };

  redirect(adminMessagePath("/admin/users", result));
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminNote?: string | null
): Promise<AdminActionResult> {
  const profile = await requireRole(["admin"]);

  if (!reportId || !isReportStatus(status)) {
    return { error: "Trạng thái report không hợp lệ." };
  }

  const isFinalStatus = status === "resolved" || status === "rejected";
  const supabase = await createClient();
  const { error } = await supabase
    .from("room_reports")
    .update({
      admin_note: adminNote ?? null,
      resolved_at: isFinalStatus ? new Date().toISOString() : null,
      resolved_by: isFinalStatus ? profile.id : null,
      status
    })
    .eq("id", reportId);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminPaths();
  return { message: "Đã cập nhật report." };
}

export async function resolveReport(reportId: string, adminNote?: string | null) {
  return updateReportStatus(reportId, "resolved", adminNote);
}

export async function rejectReport(reportId: string, adminNote?: string | null) {
  return updateReportStatus(reportId, "rejected", adminNote);
}

export async function updateReportStatusFormAction(formData: FormData) {
  const reportId = getString(formData, "report_id");
  const status = getString(formData, "status");
  const adminNote = nullableText(formData, "admin_note");
  const result = isReportStatus(status)
    ? await updateReportStatus(reportId, status, adminNote)
    : { error: "Trạng thái report không hợp lệ." };

  redirect(adminMessagePath("/admin/reports", result));
}

export async function updateBuildingVisibility(
  buildingId: string,
  visibility: VisibilityStatus
): Promise<AdminActionResult> {
  await requireRole(["admin"]);

  if (!buildingId || !isVisibilityStatus(visibility)) {
    return { error: "Trạng thái hiển thị căn nhà không hợp lệ." };
  }

  const supabase = await createClient();
  const { data: building, error: lookupError } = await supabase
    .from("buildings")
    .select("id, public_slug")
    .eq("id", buildingId)
    .maybeSingle<{ id: string; public_slug: string }>();

  if (lookupError) {
    return { error: lookupError.message };
  }

  if (!building) {
    return { error: "Không tìm thấy căn nhà." };
  }

  const { error } = await supabase.from("buildings").update({ visibility }).eq("id", buildingId);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminPaths();
  revalidatePath("/broker");
  revalidatePath("/broker/rooms");
  revalidatePath(`/b/${building.public_slug}`);
  return { message: "Đã cập nhật hiển thị căn nhà." };
}

export async function updateBuildingVisibilityFormAction(formData: FormData) {
  const buildingId = getString(formData, "building_id");
  const visibility = getString(formData, "visibility");
  const result = isVisibilityStatus(visibility)
    ? await updateBuildingVisibility(buildingId, visibility)
    : { error: "Trạng thái hiển thị căn nhà không hợp lệ." };

  redirect(adminMessagePath("/admin/buildings", result));
}

export async function updateRoomVisibility(
  roomId: string,
  visibility: VisibilityStatus
): Promise<AdminActionResult> {
  await requireRole(["admin"]);

  if (!roomId || !isVisibilityStatus(visibility)) {
    return { error: "Trạng thái hiển thị phòng không hợp lệ." };
  }

  const supabase = await createClient();
  const { data: room, error: lookupError } = await supabase
    .from("rooms")
    .select("id, public_slug, building_id")
    .eq("id", roomId)
    .maybeSingle<{ id: string; public_slug: string; building_id: string }>();

  if (lookupError) {
    return { error: lookupError.message };
  }

  if (!room) {
    return { error: "Không tìm thấy phòng." };
  }

  const { error } = await supabase.from("rooms").update({ visibility }).eq("id", roomId);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminPaths();
  revalidatePath("/broker");
  revalidatePath("/broker/rooms");
  revalidatePath(`/r/${room.public_slug}`);
  revalidatePath(`/landlord/rooms/${room.id}`);
  revalidatePath(`/landlord/buildings/${room.building_id}`);
  return { message: "Đã cập nhật hiển thị phòng." };
}

export async function updateRoomVisibilityFormAction(formData: FormData) {
  const roomId = getString(formData, "room_id");
  const visibility = getString(formData, "visibility");
  const result = isVisibilityStatus(visibility)
    ? await updateRoomVisibility(roomId, visibility)
    : { error: "Trạng thái hiển thị phòng không hợp lệ." };

  redirect(adminMessagePath("/admin/rooms", result));
}

export async function updateRoomStatus(
  roomId: string,
  status: RoomStatus
): Promise<AdminActionResult> {
  await requireRole(["admin"]);

  if (!roomId || !isRoomStatus(status)) {
    return { error: "Trạng thái phòng không hợp lệ." };
  }

  const supabase = await createClient();
  const { data: room, error: lookupError } = await supabase
    .from("rooms")
    .select("id, public_slug, building_id")
    .eq("id", roomId)
    .maybeSingle<{ id: string; public_slug: string; building_id: string }>();

  if (lookupError) {
    return { error: lookupError.message };
  }

  if (!room) {
    return { error: "Không tìm thấy phòng." };
  }

  const { error } = await supabase.from("rooms").update({ status }).eq("id", roomId);

  if (error) {
    return { error: error.message };
  }

  revalidateAdminPaths();
  revalidatePath("/broker");
  revalidatePath("/broker/rooms");
  revalidatePath(`/r/${room.public_slug}`);
  revalidatePath(`/landlord/rooms/${room.id}`);
  revalidatePath(`/landlord/buildings/${room.building_id}`);
  return { message: "Đã cập nhật trạng thái phòng." };
}
