"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/profile";
import { isRoomStatus } from "@/lib/landlord/queries";
import type {
  FeeMode,
  LandlordFormState,
  RoomFeature,
  RoomImage,
  RoomStatus
} from "@/lib/landlord/types";
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
  return formData.get(key) === "on";
}

function isFeeMode(value: string): value is FeeMode {
  return value === "building_default" || value === "room_override";
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
    .maybeSingle<Record<string, unknown> & { id: string; building_id: string }>();

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
  const address = getString(formData, "address");
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
    district: nullableString(formData, "district"),
    formatted_address: nullableString(formData, "formatted_address"),
    google_place_id: nullableString(formData, "google_place_id"),
    google_maps_url: nullableString(formData, "google_maps_url"),
    house_rules: nullableString(formData, "house_rules"),
    latitude: parseOptionalCoordinate(formData, "latitude", "Vui lòng nhập vĩ độ hợp lệ."),
    longitude: parseOptionalCoordinate(formData, "longitude", "Vui lòng nhập kinh độ hợp lệ."),
    name,
    ward: nullableString(formData, "ward")
  };
}

function withoutMapFields<T extends Record<string, unknown>>(payload: T) {
  const {
    formatted_address: _formattedAddress,
    google_place_id: _googlePlaceId,
    latitude: _latitude,
    longitude: _longitude,
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
    message.includes("formatted_address") ||
    message.includes("google_place_id")
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

function getRoomPayload(formData: FormData) {
  const roomCode = getString(formData, "room_code");
  const status = getString(formData, "status");
  const feeMode = getString(formData, "fee_mode") || "building_default";

  if (!roomCode) {
    throw new Error("Vui lòng nhập mã phòng.");
  }

  if (!isRoomStatus(status)) {
    throw new Error("Trạng thái phòng không hợp lệ.");
  }

  if (!isFeeMode(feeMode)) {
    throw new Error("Cách dùng phí không hợp lệ.");
  }

  return {
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
    weaknesses: nullableString(formData, "weaknesses")
  };
}

function getRoomFeesPayload(formData: FormData, roomId: string) {
  return {
    ...getFeePayload(formData),
    room_id: roomId
  };
}

function getRoomFeaturesPayload(formData: FormData, roomId: string) {
  return {
    allows_pet: checkbox(formData, "allows_pet"),
    has_air_conditioner: checkbox(formData, "has_air_conditioner"),
    has_balcony: checkbox(formData, "has_balcony"),
    has_bed: checkbox(formData, "has_bed"),
    has_elevator: checkbox(formData, "has_elevator"),
    has_fridge: checkbox(formData, "has_fridge"),
    has_parking: checkbox(formData, "has_parking"),
    has_private_bathroom: checkbox(formData, "has_private_bathroom"),
    has_private_kitchen: checkbox(formData, "has_private_kitchen"),
    has_security: checkbox(formData, "has_security"),
    has_wardrobe: checkbox(formData, "has_wardrobe"),
    has_washing_machine: checkbox(formData, "has_washing_machine"),
    has_window: checkbox(formData, "has_window"),
    is_furnished: checkbox(formData, "is_furnished"),
    room_id: roomId
  };
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

    await requireOwnedBuilding(buildingId, profile.id);

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        ...payload,
        building_id: buildingId,
        visibility: "visible"
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      return { error: error.message };
    }

    const featurePayload = getRoomFeaturesPayload(formData, data.id);
    const feePayload = getRoomFeesPayload(formData, data.id);
    const actions = [supabase.from("room_features").insert(featurePayload)];

    if (payload.fee_mode === "room_override") {
      actions.push(supabase.from("room_fees").insert(feePayload));
    } else {
      actions.push(
        supabase.from("building_fees").upsert(
          {
            ...getFeePayload(formData),
            building_id: buildingId
          },
          { onConflict: "building_id" }
        )
      );
    }

    const results = await Promise.all(actions);
    const actionError = results.find((result) => result.error)?.error;

    if (actionError) {
      return { error: actionError.message };
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
    const payload = getRoomPayload(formData);
    const supabase = await createClient();
    const ownedRoom = await requireOwnedRoom(roomId, profile.id);

    const { error } = await supabase.from("rooms").update(payload).eq("id", roomId);

    if (error) {
      return { error: error.message };
    }

    const { error: featuresError } = await supabase
      .from("room_features")
      .upsert(getRoomFeaturesPayload(formData, roomId), { onConflict: "room_id" });

    if (featuresError) {
      return { error: featuresError.message };
    }

    if (payload.fee_mode === "room_override") {
      const { error: feesError } = await supabase
        .from("room_fees")
        .upsert(getRoomFeesPayload(formData, roomId), { onConflict: "room_id" });

      if (feesError) {
        return { error: feesError.message };
      }
    } else {
      await supabase.from("room_fees").delete().eq("room_id", roomId);
    }

    await saveRoomImages(formData, roomId);

    revalidateLandlordPaths(ownedRoom.building_id, roomId);
    targetPath = `/landlord/rooms/${roomId}?updated=1`;
  } catch (error) {
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
      available_from: nullableString(formData, "available_from"),
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
      status: newStatus,
      strengths: copyDescription ? sourceRoom.strengths : null,
      title: sourceRoom.title,
      visibility: "visible",
      weaknesses: copyDescription ? sourceRoom.weaknesses : null
    }));

    const { data: insertedRooms, error: insertError } = await supabase
      .from("rooms")
      .insert(newRooms)
      .select("id, room_code")
      .returns<Array<{ id: string; room_code: string }>>();

    if (insertError) {
      return { error: insertError.message };
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
