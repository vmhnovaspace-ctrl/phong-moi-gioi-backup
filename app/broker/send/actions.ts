"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerRoom } from "@/lib/broker/queries";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type CreateCustomerRoomPackageInput = {
  customerName?: string;
  customerNeed?: string;
  customerPhone?: string;
  customerZaloLink?: string;
  roomIds: string[];
};

export type CreateCustomerRoomPackageResult = {
  customerName: string | null;
  customerPhone: string | null;
  customerZaloLink: string | null;
  message: string;
  ok: true;
  packageUrl: string;
  publicSlug: string;
} | {
  error: string;
  ok: false;
};

function cleanText(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

const DEFAULT_CUSTOMER_NEED = "Khách chưa nhập nhu cầu cụ thể.";

export async function createCustomerRoomPackage(
  input: CreateCustomerRoomPackageInput
): Promise<CreateCustomerRoomPackageResult> {
  try {
    const profile = await requireRole(["broker"]);
    const customerNeed = cleanText(input.customerNeed) ?? DEFAULT_CUSTOMER_NEED;
    const roomIds = Array.from(new Set(input.roomIds));

    if (roomIds.length < 1) {
      return { error: "Vui lòng chọn ít nhất 1 phòng.", ok: false };
    }

    if (roomIds.length > 5) {
      return { error: "Nên gửi tối đa 5 phòng để khách dễ chọn.", ok: false };
    }

    const rooms = await Promise.all(roomIds.map((roomId) => getBrokerRoom(roomId, profile.id)));

    if (rooms.some((room) => !room)) {
      return { error: "Có phòng không còn phù hợp quyền xem của broker.", ok: false };
    }

    const customerName = cleanText(input.customerName);
    const customerPhone = cleanText(input.customerPhone);
    const customerZaloLink = cleanText(input.customerZaloLink);
    const title = customerName ? `Phòng phù hợp cho ${customerName}` : "Danh sách phòng phù hợp cho bạn";
    const publicSlug = `pkg-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const supabase = await createClient();
    const { data: packageRow, error } = await supabase
      .from("customer_room_packages")
      .insert({
        broker_id: profile.id,
        customer_name: customerName,
        customer_need: customerNeed,
        customer_phone: customerPhone,
        customer_zalo_link: customerZaloLink,
        public_slug: publicSlug,
        title
      })
      .select("id, public_slug")
      .single<{ id: string; public_slug: string }>();

    if (error) {
      return { error: formatPackageError(error.message), ok: false };
    }

    const { error: itemError } = await supabase.from("customer_room_package_items").insert(
      roomIds.map((roomId, index) => ({
        package_id: packageRow.id,
        room_id: roomId,
        sort_order: index
      }))
    );

    if (itemError) {
      return { error: formatPackageError(itemError.message), ok: false };
    }

    const packageUrl = `${getSiteUrl().replace(/\/$/, "")}/p/${packageRow.public_slug}`;
    const message = buildZaloMessage(customerName, packageUrl);

    revalidatePath("/broker/send");

    return {
      customerName,
      customerPhone,
      customerZaloLink,
      message,
      ok: true,
      packageUrl,
      publicSlug: packageRow.public_slug
    };
  } catch (error) {
    return {
      error: error instanceof Error ? formatPackageError(error.message) : "Không tạo được gói gửi khách.",
      ok: false
    };
  }
}

export async function hideCustomerRoomPackage(packageId: string): Promise<{ error?: string; ok: boolean }> {
  try {
    const profile = await requireRole(["broker"]);
    const supabase = await createClient();
    const { error } = await supabase
      .from("customer_room_packages")
      .update({ status: "hidden" })
      .eq("id", packageId)
      .eq("broker_id", profile.id);

    if (error) {
      return { error: formatPackageError(error.message), ok: false };
    }

    revalidatePath("/broker/send");

    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? formatPackageError(error.message) : "Không ẩn được gói gửi khách.",
      ok: false
    };
  }
}

function buildZaloMessage(customerName: string | null, packageUrl: string) {
  const greeting = customerName
    ? `Em gửi anh/chị ${customerName} danh sách phòng em đã lọc theo nhu cầu.`
    : "Em gửi anh/chị danh sách phòng em đã lọc theo nhu cầu.";

  return [
    greeting,
    "",
    "Xem ảnh, giá và thông tin từng phòng tại link này:",
    packageUrl,
    "",
    "Anh/chị xem phòng nào phù hợp thì nhắn em, em hẹn lịch xem thực tế."
  ].join("\n");
}

function formatPackageError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("customer_room_packages") ||
    lowerMessage.includes("customer_room_package_items") ||
    lowerMessage.includes("get_customer_room_package_public") ||
    lowerMessage.includes("schema cache")
  ) {
    return "Chưa chạy migration Gửi khách. Hãy chạy file supabase/module_06_customer_room_packages.sql trong Supabase SQL Editor rồi thử lại.";
  }

  if (lowerMessage.includes("row-level security") || lowerMessage.includes("violates row-level security")) {
    return "Không tạo được gói vì RLS chặn dữ liệu này. Hãy kiểm tra broker đang active và các phòng được chọn thuộc quyền xem của broker.";
  }

  return message || "Không tạo được gói gửi khách.";
}
