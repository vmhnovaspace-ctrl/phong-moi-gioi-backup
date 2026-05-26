import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type InterestRequest = {
  roomId?: string;
};

type InterestRpcResult = {
  ok?: boolean;
  error?: string;
  created?: boolean;
  event_id?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ packageSlug: string }> }
) {
  try {
    const { packageSlug } = await params;
    const input = (await request.json()) as InterestRequest;
    const roomId = input.roomId?.trim();

    if (!roomId) {
      return jsonError("Thiếu mã phòng cần quan tâm.");
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("record_customer_room_package_interest", {
      package_slug: packageSlug,
      selected_room_id: roomId
    });

    if (error) {
      return jsonError(formatInterestError(error.message));
    }

    const result = normalizeRpcResult(data);

    if (!result.ok) {
      return jsonError(result.error ?? "Không gửi được thông tin quan tâm.");
    }

    revalidatePath("/broker");
    revalidatePath("/broker/actions");
    revalidatePath("/broker/send");

    return NextResponse.json({
      created: Boolean(result.created),
      eventId: result.event_id ?? null,
      ok: true
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? formatInterestError(error.message) : "Không gửi được thông tin quan tâm."
    );
  }
}

function normalizeRpcResult(value: unknown): InterestRpcResult {
  if (!value || typeof value !== "object") {
    return { ok: false };
  }

  return value as InterestRpcResult;
}

function jsonError(error: string) {
  return NextResponse.json({ error, ok: false }, { status: 200 });
}

function formatInterestError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("record_customer_room_package_interest") ||
    lowerMessage.includes("customer_room_package_events") ||
    lowerMessage.includes("schema cache")
  ) {
    return "Chưa chạy migration ghi nhận khách quan tâm. Hãy chạy file supabase/module_10_customer_interest_events.sql rồi thử lại.";
  }

  return message || "Không gửi được thông tin quan tâm.";
}
