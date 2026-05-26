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

function revalidateBrokerRoomPaths(roomId: string) {
  revalidatePath("/broker");
  revalidatePath("/broker/rooms");
  revalidatePath("/broker/saved");
  revalidatePath("/broker/actions");
  revalidatePath(`/broker/rooms/${roomId}`);
}

function revalidateBrokerCustomerPaths() {
  revalidatePath("/broker");
  revalidatePath("/broker/actions");
  revalidatePath("/broker/send");
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
    throw new Error("Không tìm thấy phòng phù hợp quyền broker.");
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
    .update({ is_read: true })
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
