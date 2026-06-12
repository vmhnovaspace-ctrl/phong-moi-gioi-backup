import { BrokerInventoryView } from "@/components/broker/broker-inventory-view";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerInventory } from "@/lib/broker/queries";
import type { BrokerInventoryFilters, BrokerVisibleRoomStatus } from "@/lib/broker/types";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Xem thông tin chi tiết phòng trống",
  description: "Danh sách phòng trống đang cập nhật realtime trong Kho Phòng Realtime.",
  openGraph: {
    title: "Xem thông tin chi tiết phòng trống",
    description: "Danh sách phòng trống đang cập nhật realtime. Đăng nhập hoặc đăng ký tài khoản môi giới để xem chi tiết.",
    images: ["/og/broker-rooms.png"],
  },
};

type BrokerRoomsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function moneyParam(value: string | string[] | undefined) {
  const raw = firstParam(value);

  if (!raw) {
    return undefined;
  }

  const normalized = raw.replace(/[^\d]/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function decimalParam(value: string | string[] | undefined) {
  const raw = firstParam(value);

  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw.replace(",", ".").replace(/[^\d.]/g, ""));

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function statusParam(value: string | string[] | undefined): BrokerInventoryFilters["status"] {
  const raw = firstParam(value);

  if (raw === "available" || raw === "coming_soon") {
    return raw satisfies BrokerVisibleRoomStatus;
  }

  return "all";
}

function parseFilters(params: Record<string, string | string[] | undefined>): BrokerInventoryFilters {
  const boundaryMode = firstParam(params.boundaryMode);
  const parsedBoundaryMode = boundaryMode === "new" ? "new" : "old";

  return {
    allowsPet: firstParam(params.allowsPet) === "1",
    boundaryMode: parsedBoundaryMode,
    district: parsedBoundaryMode === "new" ? undefined : firstParam(params.district)?.trim() || undefined,
    furnished: firstParam(params.furnished) === "1",
    landlord: firstParam(params.landlord)?.trim() || undefined,
    landlordId: firstParam(params.landlordId)?.trim() || undefined,
    maxArea: decimalParam(params.maxArea),
    maxPrice: moneyParam(params.maxPrice),
    minArea: decimalParam(params.minArea),
    minPrice: moneyParam(params.minPrice),
    q: firstParam(params.q)?.trim() || undefined,
    status: statusParam(params.status),
    ward: firstParam(params.ward)?.trim() || undefined
  };
}

export default async function BrokerRoomsPage({ searchParams }: BrokerRoomsPageProps) {
  const rawSearchParams = await searchParams;
  const nextPath = buildNextPath(rawSearchParams);
  const profile = await requireRole(["broker"], nextPath);
  const filters = parseFilters(rawSearchParams);
  const inventory = await getBrokerInventory(filters, profile.id);

  return <BrokerInventoryView inventory={inventory} />;
}

function buildNextPath(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `/broker/rooms?${queryString}` : "/broker/rooms";
}
