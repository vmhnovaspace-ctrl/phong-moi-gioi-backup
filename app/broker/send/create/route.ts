import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerRoom } from "@/lib/broker/queries";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type CreatePackageRequest = {
  customerName?: string;
  customerNeed?: string;
  customerPhone?: string;
  customerZaloLink?: string;
  roomIds?: string[];
};

const DEFAULT_CUSTOMER_NEED = "Khách chưa nhập nhu cầu cụ thể.";

function cleanText(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CreatePackageRequest;
    const profile = await requireRole(["broker"]);
    const customerNeed = cleanText(input.customerNeed) ?? DEFAULT_CUSTOMER_NEED;
    const roomIds = Array.from(new Set(input.roomIds ?? []));

    if (roomIds.length < 1) {
      return jsonError("Vui lòng chọn ít nhất 1 phòng.");
    }

    if (roomIds.length > 5) {
      return jsonError("Nên gửi tối đa 5 phòng để khách dễ chọn.");
    }

    const rooms = await Promise.all(roomIds.map((roomId) => getBrokerRoom(roomId, profile.id)));

    if (rooms.some((room) => !room)) {
      return jsonError("Có phòng không còn phù hợp quyền xem của broker.");
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

    if (error || !packageRow) {
      return jsonError(formatPackageError(error?.message ?? "Không tạo được package."));
    }

    const { error: itemError } = await supabase.from("customer_room_package_items").insert(
      roomIds.map((roomId, index) => ({
        package_id: packageRow.id,
        room_id: roomId,
        sort_order: index
      }))
    );

    if (itemError) {
      return jsonError(formatPackageError(itemError.message));
    }

    const packageUrl = `${getSiteUrl().replace(/\/$/, "")}/p/${packageRow.public_slug}`;
    const message = buildZaloMessage(customerName, packageUrl);

    revalidatePath("/broker/send");

    return NextResponse.json({
      customerName,
      customerPhone,
      customerZaloLink,
      message,
      ok: true,
      packageUrl,
      publicSlug: packageRow.public_slug
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? formatPackageError(error.message) : "Không tạo được gói gửi khách."
    );
  }
}

function jsonError(error: string) {
  return NextResponse.json({ error, ok: false }, { status: 200 });
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
