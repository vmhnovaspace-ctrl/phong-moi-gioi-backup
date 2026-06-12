"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/profile";
import { isRoomStatus } from "@/lib/landlord/queries";
import type {
  FeeMode,
  LandlordFormState,
  Room,
  RoomFeature,
  RoomImage,
  RoomSellEventType,
  RoomStatus
} from "@/lib/landlord/types";
import {
  getLegacyRoomLayoutFeatureFlags,
  parseRoomLayoutsFromFormData
} from "@/lib/rooms/room-metadata";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function parseOptionalInteger(formData: FormData, key: string, message: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^\d]/g, "");
  const numberValue = Number(normalized);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(message);
  }

  return numberValue;
}

function parseOptionalMoney(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^\d]/g, "");
  const numberValue = Number(normalized);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error("Vui lòng nhập số tiền hợp lệ.");
  }

  return numberValue;
}

function parseRequiredMoney(formData: FormData, key: string) {
  const value = parseOptionalMoney(formData, key);

  if (value === null) {
    throw new Error("Vui lòng nhập giá thuê hợp lệ.");
  }

  return value;
}

function parseOptionalDecimal(formData: FormData, key: string) {
  const value = getString(formData, key).replace(",", ".");

  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error("Vui lòng nhập diện tích hợp lệ.");
  }

  return numberValue;
}

function parseOptionalCoordinate(formData: FormData, key: string, message: string) {
  const value = getString(formData, key).replace(",", ".");

  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error(message);
  }

  return numberValue;
}

function checkbox(formData: FormData, key: string) {
  return formData.getAll(key).some((value) => value !== "false" && value !== "0" && value !== "");
}

function isFeeMode(value: string): value is FeeMode {
  return value === "building_default" || value === "room_override";
}

function isRoomSellEventType(value: string): value is RoomSellEventType {
  return (
    value === "share_landlord" ||
    value === "share_building" ||
    value === "share_room" ||
    value === "closed_announcement"
  );
}

async function requireOwnedBuilding(buildingId: string, landlordId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("buildings")
    .select("id, landlord_id")
    .eq("id", buildingId)
    .eq("landlord_id", landlordId)
    .maybeSingle<{ id: string; landlord_id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Không tìm thấy căn nhà thuộc tài khoản này.");
  }

  return data;
}

async function requireOwnedRoom(roomId: string, landlordId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, buildings!inner(id, landlord_id)")
    .eq("id", roomId)
    .eq("buildings.landlord_id", landlordId)
    .maybeSingle<
      Room & {
        buildings:
          | { id: string; landlord_id: string }
          | Array<{ id: string; landlord_id: string }>;
      }
    >();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Không tìm thấy phòng thuộc tài khoản này.");
  }

  return data;
}

function getBuildingPayload(formData: FormData) {
  const name = getString(formData, "name");
  const oldAddress = getString(formData, "old_address");
  const oldWard = nullableString(formData, "old_ward");
  const oldDistrict = nullableString(formData, "old_district");
  const newAddress = getString(formData, "new_address");
  const newWard = nullableString(formData, "new_ward");
  const newDistrict = nullableString(formData, "new_district");
  const address = newAddress || oldAddress;
  const ward = newWard ?? oldWard;
  const district = newDistrict ?? oldDistrict;
  const city = getString(formData, "city") || "TP.HCM";

  if (!name || !address) {
    throw new Error("Vui lòng nhập tên căn nhà và địa chỉ.");
  }

  return {
    address,
    building_drive_folder_url: nullableString(formData, "building_drive_folder_url"),
    city,
    common_amenities: nullableString(formData, "common_amenities"),
    description: nullableString(formData, "description"),
    district,
    formatted_address: nullableString(formData, "formatted_address"),
    google_place_id: nullableString(formData, "google_place_id"),
    google_maps_url: nullableString(formData, "google_maps_url"),
    house_rules: nullableString(formData, "house_rules"),
    latitude: parseOptionalCoordinate(formData, "latitude", "Vui lòng nhập vĩ độ hợp lệ."),
    longitude: parseOptionalCoordinate(formData, "longitude", "Vui lòng nhập kinh độ hợp lệ."),
    name,
    new_address: newAddress || null,
    new_district: newDistrict,
    new_ward: newWard,
    old_address: oldAddress || null,
    old_district: oldDistrict,
    old_ward: oldWard,
    ward,
    zalo_group_name: nullableString(formData, "zalo_group_name"),
    zalo_group_url: nullableString(formData, "zalo_group_url")
  };
}

function withoutMapFields<T extends Record<string, unknown>>(payload: T) {
  const {
    formatted_address: _formattedAddress,
    google_place_id: _googlePlaceId,
    latitude: _latitude,
    longitude: _longitude,
    new_address: _newAddress,
    new_district: _newDistrict,
    new_ward: _newWard,
    old_address: _oldAddress,
    old_district: _oldDistrict,
    old_ward: _oldWard,
    zalo_group_name: _zaloGroupName,
    zalo_group_url: _zaloGroupUrl,
    ...rest
  } = payload;

  return rest;
}

function isMissingMapColumnError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "PGRST204" ||
    message.includes("latitude") ||
    message.includes("longitude") ||
    message.includes("old_address") ||
    message.includes("old_ward") ||
    message.includes("old_district") ||
    message.includes("new_address") ||
    message.includes("new_ward") ||
    message.includes("new_district") ||
    message.includes("formatted_address") ||
    message.includes("google_place_id") ||
    message.includes("zalo_group_name") ||
    message.includes("zalo_group_url")
  );
}

function isMissingZaloMigrationError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    message.includes("landlord_zalo_group") ||
    message.includes("zalo_group_name") ||
    message.includes("zalo_group_url") ||
    message.includes("room_sell_events") ||
    message.includes("schema cache")
  );
}

function isMissingRoomCloseRequestsTableError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "42883" ||
    error.code === "PGRST202" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    message.includes("mark_room_close_request_seen") ||
    message.includes("room_close_requests") ||
    message.includes("schema cache")
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

function missingZaloMigrationMessage() {
  return "Database Supabase chưa có migration Zalo mới. Hãy chạy supabase/module_04_zalo_group_links.sql trong Supabase SQL Editor rồi lưu lại.";
}

function missingRoomLayoutsSchemaMessage() {
  return "Chưa lưu được Dạng phòng. Vui lòng thử lại hoặc liên hệ quản trị.";
}

function missingRoomCloseRequestsMigrationMessage() {
  return "Chưa xử lý được yêu cầu báo chốt. Vui lòng thử lại hoặc báo quản trị viên kiểm tra cấu hình dữ liệu.";
}

function logRoomUpdateFailure(step: string, error: unknown, context?: Record<string, unknown>) {
  console.error("[landlord.updateRoomAction]", step, {
    ...(context ?? {}),
    error
  });
}

function logMissingRoomLayoutsColumn(error: unknown, context?: Record<string, unknown>) {
  console.error(
    "[landlord.updateRoomAction] Missing column rooms.room_layouts. Run migration supabase/module_16_room_layouts_key_contract.sql.",
    {
      ...(context ?? {}),
      error
    }
  );
}

function getFeePayload(formData: FormData) {
  return {
    bicycle_parking_fee: nullableString(formData, "bicycle_parking_fee"),
    car_parking_fee: nullableString(formData, "car_parking_fee"),
    electricity_price: nullableString(formData, "electricity_price"),
    electricity_unit: getString(formData, "electricity_unit") || "kWh",
    internet_fee: nullableString(formData, "internet_fee"),
    management_fee: nullableString(formData, "management_fee"),
    motorbike_parking_fee: nullableString(formData, "motorbike_parking_fee"),
    other_fees: nullableString(formData, "other_fees"),
    service_fee: nullableString(formData, "service_fee"),
    water_price: nullableString(formData, "water_price"),
    water_unit: getString(formData, "water_unit") || "m3"
  };
}

function getRoomPayload(
  formData: FormData,
  options?: {
    fallbackWeaknesses?: string | null;
  }
) {
  const roomCode = getString(formData, "room_code");
  const status = getString(formData, "status");
  const feeMode = getString(formData, "fee_mode") || "building_default";
  const roomLayouts = parseRoomLayoutsFromFormData(formData);

  if (!roomCode) {
    throw new Error("Vui lòng nhập mã phòng.");
  }

  if (!isRoomStatus(status)) {
    throw new Error("Trạng thái phòng không hợp lệ.");
  }

  if (!isFeeMode(feeMode)) {
    throw new Error("Cách dùng phí không hợp lệ.");
  }

  const payload = {
    area_m2: parseOptionalDecimal(formData, "area_m2"),
    available_from: nullableString(formData, "available_from"),
    commission: nullableString(formData, "commission"),
    deposit_amount: parseOptionalMoney(formData, "deposit_amount"),
    description: nullableString(formData, "description"),
    fee_mode: feeMode,
    floor: nullableString(formData, "floor"),
    max_people: parseOptionalInteger(
      formData,
      "max_people",
      "Vui lòng nhập số người tối đa hợp lệ."
    ),
    min_lease_months: parseOptionalInteger(
      formData,
      "min_lease_months",
      "Thời hạn thuê tối thiểu phải lớn hơn 0."
    ),
    rent_price: parseRequiredMoney(formData, "rent_price"),
    room_code: roomCode,
    room_drive_folder_url: nullableString(formData, "room_drive_folder_url"),
    status,
    strengths: nullableString(formData, "strengths"),
    title: nullableString(formData, "title"),
    weaknesses: formData.has("weaknesses")
      ? nullableString(formData, "weaknesses")
      : options?.fallbackWeaknesses ?? null
  };

  return {
    ...payload,
    room_layouts: roomLayouts
  };
}

function getRoomFeesPayload(formData: FormData, roomId: string) {
  return {
    ...getFeePayload(formData),
    room_id: roomId
  };
}

function getRoomFeaturesPayload(formData: FormData, roomId: string, roomLayouts: string[] = []) {
  const legacyLayoutFlags = getLegacyRoomLayoutFeatureFlags(roomLayouts);

  return {
    allows_pet: checkbox(formData, "allows_pet"),
    has_air_conditioner: checkbox(formData, "has_air_conditioner"),
    has_balcony: legacyLayoutFlags.has_balcony ?? false,
    has_bed: checkbox(formData, "has_bed"),
    has_elevator: checkbox(formData, "has_elevator"),
    has_fridge: checkbox(formData, "has_fridge"),
    has_parking: checkbox(formData, "has_parking"),
    has_private_bathroom: legacyLayoutFlags.has_private_bathroom ?? false,
    has_private_kitchen: legacyLayoutFlags.has_private_kitchen ?? false,
    has_security: checkbox(formData, "has_security"),
    has_wardrobe: checkbox(formData, "has_wardrobe"),
    has_washing_machine: checkbox(formData, "has_washing_machine"),
    has_window: legacyLayoutFlags.has_window ?? false,
    is_furnished: checkbox(formData, "is_furnished"),
    room_id: roomId
  };
}

type RoomFeaturesPayload = ReturnType<typeof getRoomFeaturesPayload>;
type RoomFeatureBooleanKey = Exclude<keyof RoomFeaturesPayload, "room_id">;

const ROOM_FEATURE_SELECT =
  "room_id, allows_pet, has_air_conditioner, has_balcony, has_bed, has_elevator, has_fridge, has_parking, has_private_bathroom, has_private_kitchen, has_security, has_wardrobe, has_washing_machine, has_window, is_furnished";
const ROOM_FEATURE_BOOLEAN_KEYS: RoomFeatureBooleanKey[] = [
  "allows_pet",
  "has_air_conditioner",
  "has_balcony",
  "has_bed",
  "has_elevator",
  "has_fridge",
  "has_parking",
  "has_private_bathroom",
  "has_private_kitchen",
  "has_security",
  "has_wardrobe",
  "has_washing_machine",
  "has_window",
  "is_furnished"
];

function mismatchedRoomFeatureKeys(payload: RoomFeaturesPayload, saved: RoomFeaturesPayload) {
  return ROOM_FEATURE_BOOLEAN_KEYS.filter((key) => Boolean(saved[key]) !== payload[key]);
}

async function saveRoomFeatures(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: RoomFeaturesPayload
) {
  const { room_id: roomId, ...featureFields } = payload;
  const { data: existingRows, error: lookupError } = await supabase
    .from("room_features")
    .select("id")
    .eq("room_id", roomId)
    .returns<Array<{ id: string }>>();

  if (lookupError) {
    return { error: lookupError, step: "select existing room_features failed" };
  }

  if ((existingRows ?? []).length > 0) {
    const { data, error: updateError } = await supabase
      .from("room_features")
      .update(featureFields)
      .eq("room_id", roomId)
      .select(ROOM_FEATURE_SELECT)
      .returns<RoomFeaturesPayload[]>();

    if (updateError) {
      return { error: updateError, step: "update room_features failed" };
    }

    if (!data?.length) {
      return {
        error: new Error("Supabase returned no room_features rows after update."),
        step: "update room_features returned no rows"
      };
    }

    const mismatchedKeys = Array.from(
      new Set(data.flatMap((row) => mismatchedRoomFeatureKeys(payload, row)))
    );

    if (mismatchedKeys.length > 0) {
      return {
        error: new Error(`Saved room_features mismatch: ${mismatchedKeys.join(", ")}`),
        step: "verify room_features update failed"
      };
    }

    return null;
  }

  const { data, error: insertError } = await supabase
    .from("room_features")
    .insert(payload)
    .select(ROOM_FEATURE_SELECT)
    .single<RoomFeaturesPayload>();

  if (insertError) {
    return { error: insertError, step: "insert room_features failed" };
  }

  if (!data?.room_id) {
    return {
      error: new Error("Supabase returned no room_features row after insert."),
      step: "insert room_features returned no row"
    };
  }

  const mismatchedKeys = mismatchedRoomFeatureKeys(payload, data);

  if (mismatchedKeys.length > 0) {
    return {
      error: new Error(`Saved room_features mismatch: ${mismatchedKeys.join(", ")}`),
      step: "verify room_features insert failed"
    };
  }

  return null;
}

function imageLinks(formData: FormData) {
  const raw = getString(formData, "image_links");

  return raw
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

async function saveRoomImages(formData: FormData, roomId: string) {
  const supabase = await createClient();
  const links = imageLinks(formData);

  if (links.length > 0) {
    const { error } = await supabase.from("room_images").insert(
      links.map((link, index) => ({
        image_type: index === 0 ? "main" : "room",
        image_url: link,
        is_cover: index === 0,
        room_id: roomId,
        sort_order: index,
        source_type: link.includes("drive.google.com") ? "google_drive_link" : "external_url"
      }))
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  const uploads = formData
    .getAll("uploaded_images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  for (const [index, file] of uploads.entries()) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `rooms/${roomId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("room-images")
      .upload(storagePath, file, {
        contentType: file.type || "image/jpeg",
        upsert: false
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from("room-images").getPublicUrl(storagePath);

    const { error: imageError } = await supabase.from("room_images").insert({
      image_type: index === 0 && links.length === 0 ? "main" : "room",
      image_url: publicUrl,
      is_cover: index === 0 && links.length === 0,
      room_id: roomId,
      sort_order: links.length + index,
      source_type: "uploaded",
      storage_path: storagePath
    });

    if (imageError) {
      throw new Error(imageError.message);
    }
  }
}

async function saveBuildingImages(formData: FormData, buildingId: string) {
  const supabase = await createClient();
  const uploads = formData
    .getAll("uploaded_building_images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (uploads.length === 0) {
    return;
  }

  const { count, error: countError } = await supabase
    .from("building_images")
    .select("id", { count: "exact", head: true })
    .eq("building_id", buildingId);

  if (countError) {
    throw new Error(countError.message);
  }

  const existingCount = count ?? 0;

  for (const [index, file] of uploads.entries()) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `buildings/${buildingId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("building-images")
      .upload(storagePath, file, {
        contentType: file.type || "image/jpeg",
        upsert: false
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: signed } = await supabase.storage
      .from("building-images")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    const { error: imageError } = await supabase.from("building_images").insert({
      building_id: buildingId,
      image_type: "building",
      image_url: signed?.signedUrl ?? storagePath,
      is_cover: existingCount === 0 && index === 0,
      sort_order: existingCount + index,
      source_type: "uploaded",
      storage_path: storagePath
    });

    if (imageError) {
      throw new Error(imageError.message);
    }
  }
}

function revalidateLandlordPaths(buildingId?: string, roomId?: string) {
  revalidatePath("/landlord");
  revalidatePath("/landlord/buildings");
  revalidatePath("/landlord/sell-list");

  if (buildingId) {
    revalidatePath(`/landlord/buildings/${buildingId}`);
    revalidatePath(`/landlord/buildings/${buildingId}/sell-list`);
  }

  if (roomId) {
    revalidatePath(`/landlord/rooms/${roomId}`);
  }
}

function revalidateBrokerRoomPaths(roomId: string) {
  revalidatePath("/broker");
  revalidatePath("/broker/following");
  revalidatePath("/broker/rooms");
  revalidatePath("/broker/saved");
  revalidatePath("/broker/actions");
  revalidatePath("/broker/send");
  revalidatePath(`/broker/rooms/${roomId}`);
}

type CloseRequestRoomRow = {
  id: string;
  status: string;
  room_id: string;
  landlord_id: string;
  rooms:
    | {
        id: string;
        status: string;
        building_id: string;
        public_slug: string;
        buildings:
          | { id: string; landlord_id: string; public_slug: string }
          | Array<{ id: string; landlord_id: string; public_slug: string }>;
      }
    | Array<{
        id: string;
        status: string;
        building_id: string;
        public_slug: string;
        buildings:
          | { id: string; landlord_id: string; public_slug: string }
          | Array<{ id: string; landlord_id: string; public_slug: string }>;
      }>;
};

type PendingRoomCloseRequestRow = {
  id: string;
  room_id: string;
  landlord_id: string;
  status: string;
  created_at: string;
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

async function loadOwnedCloseRequest(requestId: string, landlordId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_close_requests")
    .select(
      "id, status, room_id, landlord_id, rooms!inner(id, status, building_id, public_slug, buildings!inner(id, landlord_id, public_slug))"
    )
    .eq("id", requestId)
    .maybeSingle<CloseRequestRoomRow>();

  if (error) {
    if (isMissingRoomCloseRequestsTableError(error)) {
      throw new Error(missingRoomCloseRequestsMigrationMessage());
    }

    throw new Error(error.message);
  }

  const room = firstRelation(data?.rooms);
  const building = firstRelation(room?.buildings);

  if (!data || !room || !building || data.landlord_id !== landlordId || building.landlord_id !== landlordId) {
    throw new Error("Không tìm thấy yêu cầu báo chốt thuộc phòng của bạn.");
  }

  return { building, request: data, room };
}

async function approvePendingCloseRequestForRoom({
  ignoreMissingTable = false,
  landlordId,
  requestId,
  resolvedBy,
  roomId
}: {
  ignoreMissingTable?: boolean;
  landlordId: string;
  requestId?: string;
  resolvedBy: string;
  roomId: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("room_close_requests")
    .select("id, room_id, landlord_id, status, created_at")
    .eq("landlord_id", landlordId)
    .eq("room_id", roomId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1);

  if (requestId) {
    query = query.eq("id", requestId);
  }

  const { data: pendingRequest, error: pendingError } = await query.maybeSingle<PendingRoomCloseRequestRow>();

  if (pendingError) {
    if (ignoreMissingTable && isMissingRoomCloseRequestsTableError(pendingError)) {
      return null;
    }

    if (isMissingRoomCloseRequestsTableError(pendingError)) {
      throw new Error(missingRoomCloseRequestsMigrationMessage());
    }

    throw new Error(pendingError.message);
  }

  if (!pendingRequest) {
    return null;
  }

  const { data: updatedRequest, error: updateError } = await supabase
    .from("room_close_requests")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
      status: "approved"
    })
    .eq("id", pendingRequest.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updateError) {
    if (ignoreMissingTable && isMissingRoomCloseRequestsTableError(updateError)) {
      return null;
    }

    if (isMissingRoomCloseRequestsTableError(updateError)) {
      throw new Error(missingRoomCloseRequestsMigrationMessage());
    }

    throw new Error(updateError.message);
  }

  return updatedRequest?.id ?? null;
}

export async function updateLandlordZaloGroupAction(
  _previousState: LandlordFormState,
  formData: FormData
): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        landlord_zalo_group_name: nullableString(formData, "landlord_zalo_group_name"),
        landlord_zalo_group_url: nullableString(formData, "landlord_zalo_group_url")
      })
      .eq("id", profile.id)
      .eq("role", "landlord");

    if (error) {
      if (isMissingZaloMigrationError(error)) {
        return { error: missingZaloMigrationMessage() };
      }

      return { error: error.message };
    }

    revalidatePath("/landlord");
    revalidatePath("/landlord/sell-list");
    return { message: "Đã lưu nhóm Zalo tổng." };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }
}

export async function updateBuildingZaloGroupAction(
  buildingId: string,
  _previousState: LandlordFormState,
  formData: FormData
): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);

  try {
    const supabase = await createClient();
    await requireOwnedBuilding(buildingId, profile.id);

    const { error } = await supabase
      .from("buildings")
      .update({
        zalo_group_name: nullableString(formData, "zalo_group_name"),
        zalo_group_url: nullableString(formData, "zalo_group_url")
      })
      .eq("id", buildingId)
      .eq("landlord_id", profile.id);

    if (error) {
      if (isMissingZaloMigrationError(error)) {
        return { error: missingZaloMigrationMessage() };
      }

      return { error: error.message };
    }

    revalidateLandlordPaths(buildingId);
    return { message: "Đã lưu nhóm Zalo của căn." };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }
}

export async function recordRoomSellEventAction(
  eventType: RoomSellEventType,
  options: { buildingId?: string; roomId?: string } = {}
): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);

  if (!isRoomSellEventType(eventType)) {
    return { error: "Loại sự kiện sell không hợp lệ." };
  }

  try {
    const supabase = await createClient();
    let buildingId = options.buildingId ?? null;
    const roomId = options.roomId ?? null;

    if (eventType === "share_building") {
      if (!buildingId) {
        return { error: "Thiếu căn nhà cần ghi nhận." };
      }

      await requireOwnedBuilding(buildingId, profile.id);
    }

    if (eventType === "share_room" || eventType === "closed_announcement") {
      if (!roomId) {
        return { error: "Thiếu phòng cần ghi nhận." };
      }

      const ownedRoom = await requireOwnedRoom(roomId, profile.id);
      buildingId = ownedRoom.building_id;
    }

    if (eventType === "share_landlord") {
      buildingId = null;
    }

    const { error } = await supabase.from("room_sell_events").insert({
      building_id: buildingId,
      created_by: profile.id,
      event_type: eventType,
      landlord_id: profile.id,
      room_id: roomId
    });

    if (error) {
      if (isMissingZaloMigrationError(error)) {
        return { error: missingZaloMigrationMessage() };
      }

      return { error: error.message };
    }

    revalidateLandlordPaths(buildingId ?? undefined, roomId ?? undefined);
    return { message: "Đã ghi nhận thao tác Zalo." };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }
}

export async function createBuildingAction(
  _previousState: LandlordFormState,
  formData: FormData
): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);
  let targetPath = "";

  try {
    const payload = getBuildingPayload(formData);
    const supabase = await createClient();
    let { data, error } = await supabase
      .from("buildings")
      .insert({
        ...payload,
        landlord_id: profile.id,
        visibility: "visible"
      })
      .select("id")
      .single<{ id: string }>();

    if (error && isMissingMapColumnError(error)) {
      if (
        isMissingZaloMigrationError(error) &&
        (payload.zalo_group_url || payload.zalo_group_name)
      ) {
        return { error: missingZaloMigrationMessage() };
      }

      const fallbackPayload = withoutMapFields(payload);
      const fallback = await supabase
        .from("buildings")
        .insert({
          ...fallbackPayload,
          landlord_id: profile.id,
          visibility: "visible"
        })
        .select("id")
        .single<{ id: string }>();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) {
      return { error: error?.message ?? "Không tạo được căn nhà." };
    }

    const createdBuildingId = data.id;
    await saveBuildingImages(formData, createdBuildingId);
    revalidateLandlordPaths(createdBuildingId);
    targetPath = `/landlord/buildings/${createdBuildingId}`;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }

  redirect(targetPath);
}

export async function updateBuildingAction(
  buildingId: string,
  _previousState: LandlordFormState,
  formData: FormData
): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);
  let targetPath = "";

  try {
    const payload = getBuildingPayload(formData);
    const supabase = await createClient();

    await requireOwnedBuilding(buildingId, profile.id);

    let { error } = await supabase
      .from("buildings")
      .update(payload)
      .eq("id", buildingId)
      .eq("landlord_id", profile.id);

    if (error && isMissingMapColumnError(error)) {
      if (
        isMissingZaloMigrationError(error) &&
        (payload.zalo_group_url || payload.zalo_group_name)
      ) {
        return { error: missingZaloMigrationMessage() };
      }

      const fallback = await supabase
        .from("buildings")
        .update(withoutMapFields(payload))
        .eq("id", buildingId)
        .eq("landlord_id", profile.id);
      error = fallback.error;
    }

    if (error) {
      return { error: error.message };
    }

    await saveBuildingImages(formData, buildingId);
    revalidateLandlordPaths(buildingId);
    targetPath = `/landlord/buildings/${buildingId}`;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }

  redirect(targetPath);
}

export async function markRoomCloseRequestSeenAction(requestId: string): Promise<void> {
  await requireRole(["landlord"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_room_close_request_seen", {
    close_request_id: requestId
  });

  if (error && !isMissingRoomCloseRequestsTableError(error)) {
    throw new Error(error.message);
  }

  revalidatePath("/landlord");
  revalidatePath("/landlord/sell-list");
}

export async function upsertBuildingFeesAction(
  buildingId: string,
  _previousState: LandlordFormState,
  formData: FormData
): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);

  try {
    const supabase = await createClient();
    await requireOwnedBuilding(buildingId, profile.id);

    const { error } = await supabase.from("building_fees").upsert(
      {
        ...getFeePayload(formData),
        building_id: buildingId
      },
      { onConflict: "building_id" }
    );

    if (error) {
      return { error: error.message };
    }

    revalidateLandlordPaths(buildingId);
    return { message: "Đã lưu phí chung căn nhà." };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }
}

export async function createRoomAction(
  buildingId: string,
  _previousState: LandlordFormState,
  formData: FormData
): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);
  let targetPath = "";

  try {
    const payload = getRoomPayload(formData);
    const supabase = await createClient();
    const roomLayouts = "room_layouts" in payload && Array.isArray(payload.room_layouts) ? payload.room_layouts : [];

    await requireOwnedBuilding(buildingId, profile.id);

    let { data, error } = await supabase
      .from("rooms")
      .insert({
        ...payload,
        building_id: buildingId,
        visibility: "visible"
      })
      .select("id")
      .single<{ id: string }>();

    if (error && isMissingRoomLayoutsColumnError(error)) {
      logMissingRoomLayoutsColumn(error, {
        action: "createRoomAction",
        buildingId,
        landlordId: profile.id,
        roomLayouts,
        requiredMigration: "supabase/module_16_room_layouts_key_contract.sql"
      });
      return { error: missingRoomLayoutsSchemaMessage() };
    }

    if (error) {
      return { error: error.message };
    }

    if (!data) {
      return { error: "Không tạo được phòng." };
    }

    const featurePayload = getRoomFeaturesPayload(formData, data.id, roomLayouts);
    const featuresSaveFailure = await saveRoomFeatures(supabase, featurePayload);

    if (featuresSaveFailure) {
      logRoomUpdateFailure(featuresSaveFailure.step, featuresSaveFailure.error, {
        action: "createRoomAction",
        buildingId,
        featurePayload,
        landlordId: profile.id,
        roomId: data.id
      });
      return { error: "Không lưu được tiện ích của phòng. Vui lòng thử lại." };
    }

    const feePayload = getRoomFeesPayload(formData, data.id);
    let feeError: { message: string } | null = null;

    if (payload.fee_mode === "room_override") {
      const { error: roomFeeError } = await supabase.from("room_fees").insert(feePayload);
      feeError = roomFeeError;
    } else {
      const { error: buildingFeeError } = await supabase.from("building_fees").upsert(
        {
          ...getFeePayload(formData),
          building_id: buildingId
        },
        { onConflict: "building_id" }
      );
      feeError = buildingFeeError;
    }

    if (feeError) {
      return { error: feeError.message };
    }

    await saveRoomImages(formData, data.id);

    revalidateLandlordPaths(buildingId, data.id);
    targetPath = `/landlord/rooms/${data.id}?created=1`;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }

  redirect(targetPath);
}

export async function updateRoomAction(
  roomId: string,
  _previousState: LandlordFormState,
  formData: FormData
): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);
  let targetPath = "";

  try {
    const supabase = await createClient();
    const ownedRoom = await requireOwnedRoom(roomId, profile.id);
    const payload = getRoomPayload(formData, {
      fallbackWeaknesses: ownedRoom.weaknesses
    });
    const roomLayouts = "room_layouts" in payload && Array.isArray(payload.room_layouts) ? payload.room_layouts : [];

    let {
      data: updatedRoom,
      error
    } = await supabase
      .from("rooms")
      .update(payload)
      .eq("id", roomId)
      .eq("building_id", ownedRoom.building_id)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error && isMissingRoomLayoutsColumnError(error)) {
      logMissingRoomLayoutsColumn(error, {
        action: "updateRoomAction",
        roomId,
        buildingId: ownedRoom.building_id,
        landlordId: profile.id,
        roomLayouts,
        updatePayloadHasRoomLayouts: "room_layouts" in payload,
        requiredMigration: "supabase/module_16_room_layouts_key_contract.sql"
      });
      return { error: missingRoomLayoutsSchemaMessage() };
    }

    if (error) {
      logRoomUpdateFailure("update rooms failed", error, {
        roomId,
        buildingId: ownedRoom.building_id,
        landlordId: profile.id
      });
      return { error: "Không lưu được phòng. Vui lòng thử lại." };
    }

    if (!updatedRoom) {
      logRoomUpdateFailure("update rooms matched no rows", null, {
        roomId,
        buildingId: ownedRoom.building_id,
        landlordId: profile.id
      });
      return { error: "Không lưu được phòng. Không tìm thấy phòng cần cập nhật." };
    }

    const featurePayload = getRoomFeaturesPayload(formData, roomId, roomLayouts);
    const featuresSaveFailure = await saveRoomFeatures(supabase, featurePayload);

    if (featuresSaveFailure) {
      logRoomUpdateFailure(featuresSaveFailure.step, featuresSaveFailure.error, {
        action: "updateRoomAction",
        buildingId: ownedRoom.building_id,
        featurePayload,
        roomId,
        landlordId: profile.id
      });
      return { error: "Không lưu được tiện ích của phòng. Vui lòng thử lại." };
    }

    if (payload.fee_mode === "room_override") {
      const { data: savedFees, error: feesError } = await supabase
        .from("room_fees")
        .upsert(getRoomFeesPayload(formData, roomId), { onConflict: "room_id" })
        .select("room_id")
        .maybeSingle<{ room_id: string }>();

      if (feesError) {
        logRoomUpdateFailure("upsert room_fees failed", feesError, {
          roomId,
          landlordId: profile.id
        });
        return { error: "Không lưu được bộ phí của phòng. Vui lòng thử lại." };
      }

      if (!savedFees) {
        logRoomUpdateFailure("upsert room_fees returned no row", null, {
          roomId,
          landlordId: profile.id
        });
        return { error: "Không lưu được bộ phí của phòng. Vui lòng thử lại." };
      }
    } else {
      const { error: deleteFeesError } = await supabase.from("room_fees").delete().eq("room_id", roomId);

      if (deleteFeesError) {
        logRoomUpdateFailure("delete room_fees failed", deleteFeesError, {
          roomId,
          landlordId: profile.id
        });
        return { error: "Không cập nhật được chế độ phí của phòng. Vui lòng thử lại." };
      }
    }

    await saveRoomImages(formData, roomId);

    revalidateLandlordPaths(ownedRoom.building_id, roomId);
    targetPath = `/landlord/rooms/${roomId}?updated=1`;
  } catch (error) {
    logRoomUpdateFailure("unexpected failure", error, {
      roomId,
      landlordId: profile.id
    });

    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }

  redirect(targetPath);
}

export async function quickUpdateRoomAction(formData: FormData) {
  const profile = await requireRole(["landlord"]);
  const roomId = getString(formData, "room_id");

  if (!roomId) {
    throw new Error("Thiếu phòng cần cập nhật.");
  }

  const ownedRoom = await requireOwnedRoom(roomId, profile.id);
  const status = getString(formData, "status");

  if (!isRoomStatus(status)) {
    throw new Error("Trạng thái phòng không hợp lệ.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("rooms")
    .update({
      available_from: status === "coming_soon" ? nullableString(formData, "available_from") : null,
      deposit_amount: parseOptionalMoney(formData, "deposit_amount"),
      rent_price: parseRequiredMoney(formData, "rent_price"),
      status
    })
    .eq("id", roomId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateLandlordPaths(ownedRoom.building_id, roomId);
}

export async function markRoomRentedFromSellListAction(roomId: string): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);

  try {
    const ownedRoom = await requireOwnedRoom(roomId, profile.id);
    const currentStatus = typeof ownedRoom.status === "string" ? ownedRoom.status : "";

    if (currentStatus !== "available" && currentStatus !== "coming_soon") {
      return { error: "Chỉ có thể chốt phòng đang trống hoặc sắp trống." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("rooms")
      .update({
        available_from: null,
        status: "rented"
      })
      .eq("id", roomId);

    if (error) {
      return { error: error.message };
    }

    await approvePendingCloseRequestForRoom({
      ignoreMissingTable: true,
      landlordId: profile.id,
      resolvedBy: profile.id,
      roomId
    });

    revalidateLandlordPaths(ownedRoom.building_id, roomId);
    revalidateBrokerRoomPaths(roomId);
    return { message: "Đã chốt phòng. Phòng đã chuyển sang trạng thái đã thuê." };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }
}

export async function confirmRoomCloseRequest(requestId: string): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);

  try {
    const { building, request, room } = await loadOwnedCloseRequest(requestId, profile.id);

    if (request.status !== "pending") {
      return { error: "Yêu cầu báo chốt này đã được xử lý." };
    }

    const supabase = await createClient();
    const { error: roomError } = await supabase
      .from("rooms")
      .update({
        available_from: null,
        status: "rented"
      })
      .eq("id", room.id);

    if (roomError) {
      return { error: roomError.message };
    }

    const updatedRequestId = await approvePendingCloseRequestForRoom({
      landlordId: profile.id,
      requestId,
      resolvedBy: profile.id,
      roomId: room.id
    });

    if (!updatedRequestId) {
      return { error: "Yêu cầu báo chốt này đã được xử lý." };
    }

    revalidateLandlordPaths(building.id, room.id);
    revalidateBrokerRoomPaths(room.id);
    revalidatePath(`/l/${profile.public_slug}`);
    revalidatePath(`/b/${building.public_slug}`);
    revalidatePath(`/r/${room.public_slug}`);

    return { message: "Đã xác nhận báo chốt. Phòng đã chuyển sang Đã thuê." };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }
}

export async function rejectRoomCloseRequest(requestId: string): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);

  try {
    const { building, request, room } = await loadOwnedCloseRequest(requestId, profile.id);

    if (request.status !== "pending") {
      return { error: "Yêu cầu báo chốt này đã được xử lý." };
    }

    const supabase = await createClient();
    const { data: updatedRequest, error } = await supabase
      .from("room_close_requests")
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: profile.id,
        status: "rejected"
      })
      .eq("id", requestId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      if (isMissingRoomCloseRequestsTableError(error)) {
        return { error: missingRoomCloseRequestsMigrationMessage() };
      }

      return { error: error.message };
    }

    if (!updatedRequest) {
      return { error: "Yêu cầu báo chốt này đã được xử lý." };
    }

    revalidateLandlordPaths(building.id, room.id);
    revalidateBrokerRoomPaths(room.id);

    return { message: "Đã từ chối báo chốt. Phòng vẫn nằm trong danh sách sell." };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }
}

export async function duplicateRoomAction(
  roomId: string,
  _previousState: LandlordFormState,
  formData: FormData
): Promise<LandlordFormState> {
  const profile = await requireRole(["landlord"]);
  let targetPath = "";

  try {
    const sourceRoom = await requireOwnedRoom(roomId, profile.id);
    const supabase = await createClient();
    const codes = getString(formData, "room_codes")
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      return { error: "Vui lòng nhập ít nhất một mã phòng cần tạo." };
    }

    const uniqueCodes = Array.from(new Set(codes));

    if (uniqueCodes.length !== codes.length) {
      return { error: "Danh sách mã phòng có mã bị lặp." };
    }

    const { data: existingRooms, error: existingError } = await supabase
      .from("rooms")
      .select("room_code")
      .eq("building_id", sourceRoom.building_id)
      .in("room_code", uniqueCodes)
      .returns<Array<{ room_code: string }>>();

    if (existingError) {
      return { error: existingError.message };
    }

    if (existingRooms && existingRooms.length > 0) {
      return { error: `Phòng ${existingRooms[0].room_code} đã tồn tại.` };
    }

    const statusInput = getString(formData, "new_status");
    const newStatus: RoomStatus = isRoomStatus(statusInput) ? statusInput : "hidden";
    const copyFees = checkbox(formData, "copy_fees");
    const copyFeatures = checkbox(formData, "copy_features");
    const copyImages = checkbox(formData, "copy_images");
    const copyDescription = checkbox(formData, "copy_description");

    const { data: sourceFees } = await supabase
      .from("room_fees")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle<Record<string, unknown>>();
    const { data: sourceFeatures } = await supabase
      .from("room_features")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle<RoomFeature>();
    const { data: sourceImages } = await supabase
      .from("room_images")
      .select("*")
      .eq("room_id", roomId)
      .returns<RoomImage[]>();

    const newRooms = uniqueCodes.map((roomCode) => ({
      area_m2: checkbox(formData, "copy_area") ? sourceRoom.area_m2 : null,
      available_from: sourceRoom.available_from,
      building_id: sourceRoom.building_id,
      commission: sourceRoom.commission,
      deposit_amount: checkbox(formData, "copy_deposit") ? sourceRoom.deposit_amount : null,
      description: copyDescription ? sourceRoom.description : null,
      fee_mode: copyFees ? sourceRoom.fee_mode : "building_default",
      floor: sourceRoom.floor,
      max_people: sourceRoom.max_people,
      min_lease_months: sourceRoom.min_lease_months,
      rent_price: checkbox(formData, "copy_price") ? sourceRoom.rent_price : 0,
      room_code: roomCode,
      room_drive_folder_url: copyImages ? sourceRoom.room_drive_folder_url : null,
      room_layouts: copyFeatures ? sourceRoom.room_layouts ?? [] : [],
      status: newStatus,
      strengths: copyDescription ? sourceRoom.strengths : null,
      title: sourceRoom.title,
      visibility: "visible",
      weaknesses: copyDescription ? sourceRoom.weaknesses : null
    }));

    let { data: insertedRooms, error: insertError } = await supabase
      .from("rooms")
      .insert(newRooms)
      .select("id, room_code")
      .returns<Array<{ id: string; room_code: string }>>();

    if (insertError && isMissingRoomLayoutsColumnError(insertError)) {
      logMissingRoomLayoutsColumn(insertError, {
        action: "duplicateRoomAction",
        sourceRoomId: roomId,
        buildingId: sourceRoom.building_id,
        landlordId: profile.id,
        requiredMigration: "supabase/module_16_room_layouts_key_contract.sql"
      });
      return { error: missingRoomLayoutsSchemaMessage() };
    }

    if (insertError) {
      return { error: insertError.message };
    }

    if (!insertedRooms) {
      return { error: "Không nhân bản được phòng." };
    }

    const featureRows =
      copyFeatures && sourceFeatures
        ? insertedRooms.flatMap((room) => {
            const { id: _id, room_id: _roomId, ...featureCopy } = sourceFeatures;
            return [{ ...featureCopy, room_id: room.id }];
          })
        : [];

    if (featureRows.length > 0) {
      const { error } = await supabase.from("room_features").insert(featureRows);

      if (error) {
        return { error: error.message };
      }
    }

    if (copyFees && sourceRoom.fee_mode === "room_override" && sourceFees) {
      const feeRows = insertedRooms.map((room) => {
        const { id: _id, room_id: _roomId, created_at: _created, updated_at: _updated, ...feeCopy } =
          sourceFees;
        return { ...feeCopy, room_id: room.id };
      });
      const { error } = await supabase.from("room_fees").insert(feeRows);

      if (error) {
        return { error: error.message };
      }
    }

    if (copyImages && sourceImages && sourceImages.length > 0) {
      const imageRows = insertedRooms.flatMap((room) =>
        sourceImages.map((image) => ({
          image_type: image.image_type,
          image_url: image.image_url,
          is_cover: image.is_cover,
          room_id: room.id,
          sort_order: image.sort_order,
          source_type: image.source_type,
          storage_path: image.storage_path
        }))
      );
      const { error } = await supabase.from("room_images").insert(imageRows);

      if (error) {
        return { error: error.message };
      }
    }

    revalidateLandlordPaths(sourceRoom.building_id);
    targetPath = `/landlord/buildings/${sourceRoom.building_id}?duplicated=${insertedRooms
      .map((room) => room.room_code)
      .join(",")}`;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }

  redirect(targetPath);
}
