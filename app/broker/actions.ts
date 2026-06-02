"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/profile";
import type { BrokerPostChannel, RoomReportType } from "@/lib/broker/types";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function nullableText(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

type BrokerCloseableRoomRow = {
  id: string;
  status: string;
  visibility: string;
  building_id: string;
  buildings:
    | { id: string; landlord_id: string; visibility: string }
    | Array<{ id: string; landlord_id: string; visibility: string }>;
};

type BrokerActionResult = {
  error?: string;
  message?: string;
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function revalidateBrokerRoomPaths(roomId: string) {
  revalidatePath("/broker");
  revalidatePath("/broker/following");
  revalidatePath("/broker/rooms");
  revalidatePath("/broker/saved");
  revalidatePath("/broker/actions");
  revalidatePath(`/broker/rooms/${roomId}`);
}

function revalidateBrokerCustomerPaths() {
  revalidatePath("/broker");
  revalidatePath("/broker/actions");
  revalidatePath("/broker/following");
  revalidatePath("/broker/send");
}

function isMissingRoomCloseRequestsTable(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "42883" ||
    error.code === "PGRST202" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    message.includes("acknowledge_room_close_request") ||
    message.includes("cancel_room_close_request") ||
    message.includes("room_close_requests") ||
    message.includes("schema cache")
  );
}

function roomCloseRequestsMigrationMessage() {
  return "Chưa gửi được báo chốt. Vui lòng thử lại hoặc báo quản trị viên kiểm tra cấu hình dữ liệu.";
}

async function requireBrokerVisibleRoom(roomId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, status, visibility, buildings!inner(id, visibility)")
    .eq("id", roomId)
    .eq("visibility", "visible")
    .eq("buildings.visibility", "visible")
    .in("status", ["available", "coming_soon"])
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Không tìm thấy phòng phù hợp quyền môi giới.");
  }
}

export async function createRoomCloseRequest(
  roomId: string,
  noteText = ""
): Promise<BrokerActionResult> {
  const profile = await requireRole(["broker"]);
  const note = noteText.trim().slice(0, 1000);
  const supabase = await createClient();

  try {
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, status, visibility, building_id, buildings!inner(id, landlord_id, visibility)")
      .eq("id", roomId)
      .eq("visibility", "visible")
      .eq("buildings.visibility", "visible")
      .maybeSingle<BrokerCloseableRoomRow>();

    if (roomError) {
      return { error: roomError.message };
    }

    const building = firstRelation(room?.buildings);

    if (!room || !building) {
      return { error: "Không tìm thấy phòng phù hợp quyền môi giới." };
    }

    if (room.status !== "available" && room.status !== "coming_soon") {
      return { error: "Phòng này không còn trong danh sách sell." };
    }

    const { data: existingRequest, error: existingError } = await supabase
      .from("room_close_requests")
      .select("id, status")
      .eq("room_id", roomId)
      .eq("broker_id", profile.id)
      .eq("status", "pending")
      .maybeSingle<{ id: string; status: string }>();

    if (existingError) {
      if (isMissingRoomCloseRequestsTable(existingError)) {
        return { error: roomCloseRequestsMigrationMessage() };
      }

      return { error: existingError.message };
    }

    if (existingRequest) {
      return { message: "Bạn đã báo chủ nhà, đang chờ xác nhận." };
    }

    const { error: insertError } = await supabase.from("room_close_requests").insert({
      broker_id: profile.id,
      broker_note: note.length > 0 ? note : null,
      landlord_id: building.landlord_id,
      room_id: roomId,
      status: "pending"
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return { message: "Bạn đã báo chủ nhà, đang chờ xác nhận." };
      }

      if (isMissingRoomCloseRequestsTable(insertError)) {
        return { error: roomCloseRequestsMigrationMessage() };
      }

      return { error: insertError.message };
    }

    revalidateBrokerRoomPaths(roomId);
    revalidatePath("/landlord/sell-list");
    revalidatePath(`/landlord/buildings/${building.id}`);
    revalidatePath(`/landlord/buildings/${building.id}/sell-list`);

    return { message: "Đã báo chủ nhà, đang chờ xác nhận." };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    throw error;
  }
}

export async function createRoomCloseRequestFromForm(roomId: string) {
  const result = await createRoomCloseRequest(roomId);

  if (result.error) {
    throw new Error(result.error);
  }
}

export async function cancelRoomCloseRequest(roomId: string): Promise<BrokerActionResult> {
  await requireRole(["broker"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_room_close_request", {
    room_uuid: roomId
  });

  if (error) {
    if (isMissingRoomCloseRequestsTable(error)) {
      return { error: roomCloseRequestsMigrationMessage() };
    }

    return { error: error.message };
  }

  revalidateBrokerRoomPaths(roomId);
  revalidatePath("/broker/rooms");
  revalidatePath("/landlord/sell-list");

  return { message: "Đã hủy báo chốt phòng." };
}

export async function cancelRoomCloseRequestFromForm(roomId: string) {
  const result = await cancelRoomCloseRequest(roomId);

  if (result.error) {
    throw new Error(result.error);
  }
}

export async function acknowledgeRoomCloseRequest(
  requestId: string,
  roomId: string
): Promise<BrokerActionResult> {
  await requireRole(["broker"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("acknowledge_room_close_request", {
    close_request_id: requestId
  });

  if (error) {
    if (isMissingRoomCloseRequestsTable(error)) {
      return { error: roomCloseRequestsMigrationMessage() };
    }

    return { error: error.message };
  }

  revalidateBrokerRoomPaths(roomId);

  return { message: "Đã ghi nhận kết quả báo chốt." };
}

export async function acknowledgeRoomCloseRequestFromForm(requestId: string, roomId: string) {
  const result = await acknowledgeRoomCloseRequest(requestId, roomId);

  if (result.error) {
    throw new Error(result.error);
  }
}

export async function updateBrokerRoomAction(roomId: string, formData: FormData) {
  const profile = await requireRole(["broker"]);
  await requireBrokerVisibleRoom(roomId);

  const supabase = await createClient();
  const { error } = await supabase.from("broker_room_actions").upsert(
    {
      broker_id: profile.id,
      is_saved: checkbox(formData, "is_saved"),
      posted_chotot: checkbox(formData, "posted_chotot"),
      posted_facebook: checkbox(formData, "posted_facebook"),
      posted_mogi: checkbox(formData, "posted_mogi"),
      room_id: roomId,
      sent_to_customer: checkbox(formData, "sent_to_customer")
    },
    { onConflict: "broker_id,room_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidateBrokerRoomPaths(roomId);
  redirect(`/broker/rooms/${roomId}?actions=updated`);
}

export async function saveBrokerRoomNote(roomId: string, noteText: string) {
  const profile = await requireRole(["broker"]);
  await requireBrokerVisibleRoom(roomId);

  const note = noteText.trim();

  const supabase = await createClient();
  const { error } = await supabase.from("broker_room_actions").upsert(
    {
      broker_id: profile.id,
      private_note: note.length > 0 ? note : null,
      room_id: roomId
    },
    { onConflict: "broker_id,room_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidateBrokerRoomPaths(roomId);
}

export async function setBrokerRoomSaved(roomId: string, isSaved: boolean) {
  const profile = await requireRole(["broker"]);
  await requireBrokerVisibleRoom(roomId);

  const supabase = await createClient();
  const { error } = await supabase.from("broker_room_actions").upsert(
    {
      broker_id: profile.id,
      is_saved: isSaved,
      room_id: roomId
    },
    { onConflict: "broker_id,room_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidateBrokerRoomPaths(roomId);
}

export async function markCustomerInterestEventRead(eventId: string) {
  const profile = await requireRole(["broker"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_room_package_events")
    .update({ is_read: true, seen_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("broker_id", profile.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateBrokerCustomerPaths();
}

export async function markBrokerRoomPostChannel(roomId: string, channel: BrokerPostChannel) {
  const profile = await requireRole(["broker"]);
  await requireBrokerVisibleRoom(roomId);

  const updateByChannel: Record<BrokerPostChannel, Record<string, boolean>> = {
    chotot: { posted_chotot: true },
    facebook: { posted_facebook: true },
    mogi: { posted_mogi: true },
    zalo: { sent_to_customer: true }
  };

  const supabase = await createClient();
  const { error } = await supabase.from("broker_room_actions").upsert(
    {
      broker_id: profile.id,
      room_id: roomId,
      ...updateByChannel[channel]
    },
    { onConflict: "broker_id,room_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidateBrokerRoomPaths(roomId);
}

const reportTypes: RoomReportType[] = ["rented", "wrong_price", "wrong_images", "wrong_info", "other"];

export async function submitRoomReport(roomId: string, formData: FormData) {
  const profile = await requireRole(["broker"]);
  await requireBrokerVisibleRoom(roomId);

  const reportType = getString(formData, "report_type") as RoomReportType;
  const message = nullableText(formData, "message");

  if (!reportTypes.includes(reportType)) {
    redirect(`/broker/rooms/${roomId}?report=missing-type`);
  }

  if (reportType === "other" && !message) {
    redirect(`/broker/rooms/${roomId}?report=missing-message`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("room_reports").insert({
    broker_id: profile.id,
    message,
    report_type: reportType,
    room_id: roomId,
    status: "open"
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/broker/rooms/${roomId}`);
  redirect(`/broker/rooms/${roomId}?report=sent`);
}
