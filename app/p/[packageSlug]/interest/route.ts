import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type InterestRequest = {
  roomId?: unknown;
};

type InterestRpcResult = {
  ok?: boolean;
  error?: string;
  created?: boolean;
  event_id?: string;
};

const CUSTOMER_ERROR =
  "Chưa ghi nhận được quan tâm lúc này. Vui lòng thử lại sau hoặc nhắn trực tiếp cho môi giới.";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ packageSlug: string }> }
) {
  const { packageSlug } = await params;
  const normalizedPackageSlug = packageSlug.trim();

  try {
    const input = await readInterestRequest(request);
    const roomId = typeof input.roomId === "string" ? input.roomId.trim() : "";

    if (!normalizedPackageSlug || !roomId) {
      return jsonError("Thiếu thông tin phòng cần quan tâm.");
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("record_customer_room_package_interest", {
      package_slug: normalizedPackageSlug,
      selected_room_id: roomId
    });

    if (error) {
      console.error("record_customer_room_package_interest failed", {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
        packageSlug: normalizedPackageSlug,
        roomId
      });

      return jsonError(CUSTOMER_ERROR);
    }

    const result = normalizeRpcResult(data);

    if (!result.ok) {
      console.error("record_customer_room_package_interest rejected request", {
        error: result.error,
        packageSlug: normalizedPackageSlug,
        roomId
      });

      return jsonError(CUSTOMER_ERROR);
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
    console.error("customer package interest route failed", {
      error,
      packageSlug: normalizedPackageSlug
    });

    return jsonError(CUSTOMER_ERROR);
  }
}

async function readInterestRequest(request: Request): Promise<InterestRequest> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as InterestRequest) : {};
  } catch {
    return {};
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
