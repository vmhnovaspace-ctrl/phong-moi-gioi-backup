"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BuildingZaloInlineEditor } from "@/components/landlord/building-zalo-group-panel";
import { CloseRequestActionButtons } from "@/components/landlord/close-request-action-buttons";
import { CloseRoomButton } from "@/components/landlord/close-room-button";
import { StatusBadge } from "@/components/landlord/status-badge";
import {
  ZaloImageCardModal,
  type BuildingZaloPayload,
  type ZaloImageCardMode,
  type ZaloRoom,
} from "@/components/landlord/zalo-image-cards";
import { formatArea, formatCurrencyVnd, formatDate, roomStatusLabels } from "@/lib/landlord/format";
import type { SellListClosedRoom, SellListGroup } from "@/lib/landlord/types";
import { getSiteUrl } from "@/lib/site-url";

const ALL_BUILDINGS_ZALO_ID = "__all_buildings__";

type ZaloModalState =
  | { mode: Extract<ZaloImageCardMode, "building-list">; buildingId: string }
  | { mode: Extract<ZaloImageCardMode, "push-room">; roomId: string }
  | { mode: Extract<ZaloImageCardMode, "closed-room">; roomId: string }
  | null;

type SellListViewProps = {
  groups: SellListGroup[];
  landlord: {
    id: string;
    full_name: string;
    public_slug?: string | null;
    landlord_zalo_group_url?: string | null;
    landlord_zalo_group_name?: string | null;
  };
  mode: "all" | "building";
  recentlyClosed?: SellListClosedRoom[];
};

export function SellListView({
  groups,
  landlord,
  mode,
  recentlyClosed = []
}: SellListViewProps) {
  const [zaloModal, setZaloModal] = useState<ZaloModalState>(null);
  const activeRooms = useMemo(() => groups.flatMap((group) => group.rooms), [groups]);
  const modalRooms = useMemo(
    () => [...activeRooms, ...dedupeRecentlyClosedRooms(recentlyClosed)],
    [activeRooms, recentlyClosed]
  );
  const activeBuildingGroup =
    zaloModal?.mode === "building-list"
      ? groups.find((group) => group.building.id === zaloModal.buildingId)
      : null;
  const activeRoom =
    zaloModal?.mode === "push-room" || zaloModal?.mode === "closed-room"
      ? modalRooms.find((room) => room.id === zaloModal.roomId)
      : null;
  const landlordShareId = getLandlordShareId(landlord.public_slug, landlord.id);
  const shareLink = getShareLink(landlordShareId);
  const buildingPayload = getBuildingZaloPayload({
    activeBuildingGroup,
    groups,
    landlordGroupUrl: landlord.landlord_zalo_group_url,
    modalState: zaloModal,
  });
  const activeZaloRoom = activeRoom
    ? toZaloRoom(activeRoom, activeRoom.building.name, activeRoom.building.district)
    : null;
  const content =
    mode === "building" ? (
      <BuildingSellList groups={groups} landlord={landlord} onOpenZaloModal={setZaloModal} />
    ) : (
      <AllSellList
        groups={groups}
        landlord={landlord}
        onOpenZaloModal={setZaloModal}
        recentlyClosed={recentlyClosed}
      />
    );

  return (
    <>
      {content}
      <ZaloImageCardModal
        open={Boolean(zaloModal)}
        mode={zaloModal?.mode ?? null}
        buildingPayload={buildingPayload}
        room={activeZaloRoom}
        zaloGroupUrl={
          buildingPayload?.zaloGroupUrl ??
          activeRoom?.building.zalo_group_url ??
          landlord.landlord_zalo_group_url ??
          null
        }
        shareUrl={shareLink.url}
        shareDisplayUrl={shareLink.displayUrl}
        onClose={() => setZaloModal(null)}
      />
    </>
  );
}

function BuildingSellList({
  groups,
  landlord,
  onOpenZaloModal
}: {
  groups: SellListGroup[];
  landlord: SellListViewProps["landlord"];
  onOpenZaloModal: (state: ZaloModalState) => void;
}) {
  const group = groups[0] ?? null;
  if (!group || group.rooms.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center">
        <h2 className="text-base font-semibold text-slate-950">Chưa có phòng sell</h2>
        <p className="mt-2 text-sm text-slate-600">
          Màn này chỉ gồm phòng đang trống và sắp trống trong căn này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{group.building.name}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {group.building.address}
              {group.building.district ? ` · ${group.building.district}` : ""}
            </p>
            {!group.building.zalo_group_url ? (
              <p className="mt-2 text-sm text-amber-700">
                Căn này chưa có nhóm Zalo riêng
                {landlord.landlord_zalo_group_url ? ", hệ thống sẽ dùng nhóm Zalo tổng." : "."}
              </p>
            ) : null}
          </div>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
            onClick={() => onOpenZaloModal({ mode: "building-list", buildingId: group.building.id })}
            type="button"
          >
            {group.building.zalo_group_url ? "Gửi Zalo căn này" : "Gửi bằng nhóm tổng"}
          </button>
        </div>
      </section>

      <div className="grid gap-3">
        {group.rooms.map((room) => (
          <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" key={room.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <RoomSummary room={room} />
                <CloseRequestNotice request={room.pending_close_request} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href={`/landlord/rooms/${room.id}/edit`}
                >
                  Sửa
                </Link>
                <button
                  className="inline-flex h-10 items-center justify-center rounded-md border border-[#BFDBFE] bg-white px-3 text-sm font-semibold text-[#0F5FD7] hover:bg-[#EFF6FF]"
                  onClick={() => onOpenZaloModal({ mode: "push-room", roomId: room.id })}
                  type="button"
                >
                  Đẩy phòng này
                </button>
                {room.pending_close_request ? (
                  <CloseRequestActionButtons requestId={room.pending_close_request.id} />
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AllSellList({
  groups,
  landlord,
  onOpenZaloModal,
  recentlyClosed
}: {
  groups: SellListGroup[];
  landlord: SellListViewProps["landlord"];
  onOpenZaloModal: (state: ZaloModalState) => void;
  recentlyClosed: SellListClosedRoom[];
}) {
  const activeRooms = groups.flatMap((group) => group.rooms);
  const closedRooms = dedupeRecentlyClosedRooms(recentlyClosed);
  const hasLandlordGroup = Boolean(landlord.landlord_zalo_group_url);

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Gửi vào nhóm Zalo tổng</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Tổng hợp tất cả phòng đang trống/sắp trống của mọi căn và gửi vào nhóm Zalo chung.
            </p>
            {hasLandlordGroup ? (
              <p className="mt-2 text-sm font-medium text-[#0F5FD7]">
                {landlord.landlord_zalo_group_name
                  ? `Đang dùng: ${landlord.landlord_zalo_group_name}`
                  : "Đã lưu link nhóm Zalo tổng"}
              </p>
            ) : (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Bạn chưa lưu link nhóm Zalo tổng. Hệ thống sẽ chỉ copy nội dung để bạn dán thủ công.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
              onClick={() => onOpenZaloModal({ mode: "building-list", buildingId: ALL_BUILDINGS_ZALO_ID })}
              type="button"
            >
              Gửi Zalo nhóm tổng
            </button>
            {!hasLandlordGroup ? (
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                href="/landlord#nhom-zalo-tong"
              >
                Thêm link nhóm Zalo tổng
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Gửi theo từng căn</h2>
          <p className="mt-1 text-sm text-slate-600">
            Dùng khi mỗi căn có nhóm Zalo riêng. Mỗi nút chỉ gửi các phòng đang sell của căn đó.
          </p>
        </div>
        {groups.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((group) => (
              <BuildingShareCard
                group={group}
                hasLandlordGroup={hasLandlordGroup}
                key={group.building.id}
                onOpenZaloModal={onOpenZaloModal}
              />
            ))}
          </div>
        ) : (
          <EmptySellState text="Chưa có căn nào đang có phòng sell." />
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Phòng đang sell</h2>
          <p className="mt-1 text-sm text-slate-600">
            Chỉ gồm phòng Đang trống hoặc Sắp trống.
          </p>
        </div>
        {activeRooms.length > 0 ? (
          <div className="grid gap-3">
            {groups.map((group) =>
              group.rooms.map((room) => (
                <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" key={room.id}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        {group.building.name} · {shortAddress(group.building)}
                      </p>
                      <RoomSummary room={room} />
                      <p className="text-xs text-slate-500">
                        Lần gửi/đẩy Zalo gần nhất:{" "}
                        {room.last_sell_event_at ? formatDateTime(room.last_sell_event_at) : "Chưa có dữ liệu"}
                      </p>
                      <CloseRequestNotice request={room.pending_close_request} />
                    </div>
                    {room.pending_close_request ? (
                      <CloseRequestActionButtons requestId={room.pending_close_request.id} />
                    ) : (
                      <CloseRoomButton roomId={room.id} />
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        ) : (
          <EmptySellState text="Chưa có phòng đang sell." />
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Đã chốt gần đây</h2>
          <p className="mt-1 text-sm text-slate-600">
            Phòng vừa chuyển sang đã thuê trong 24 giờ gần nhất sẽ tự ẩn sau 24 giờ.
          </p>
        </div>
        {closedRooms.length > 0 ? (
          <div className="grid gap-3">
            {closedRooms.map((room, index) => (
              <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" key={closedRoomKey(room, index)}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      {room.building.name} · {shortAddress(room.building)}
                    </p>
                    <RoomSummary room={room} />
                    <p className="text-xs text-slate-500">
                      Đã chốt lúc {formatDateTime(room.closed_at)}
                      {!room.closed_from_log ? " · fallback theo thời gian cập nhật phòng" : ""}
                    </p>
                  </div>
                  <button
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#BFDBFE] bg-white px-3 text-sm font-semibold text-[#0F5FD7] hover:bg-[#EFF6FF]"
                    onClick={() => onOpenZaloModal({ mode: "closed-room", roomId: room.id })}
                    type="button"
                  >
                    Thông báo Zalo
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptySellState text="Chưa có phòng chốt trong 24 giờ gần nhất." />
        )}
      </section>
    </div>
  );
}

function BuildingShareCard({
  group,
  hasLandlordGroup,
  onOpenZaloModal
}: {
  group: SellListGroup;
  hasLandlordGroup: boolean;
  onOpenZaloModal: (state: ZaloModalState) => void;
}) {
  const hasBuildingGroup = Boolean(group.building.zalo_group_url);
  const status = getBuildingZaloStatus(hasBuildingGroup, hasLandlordGroup);

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-slate-950">{group.building.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{shortAddress(group.building)}</p>
          <p className="mt-2 text-sm text-slate-600">{group.rooms.length} phòng đang sell</p>
          <p className={`mt-1 text-sm font-medium ${status.className}`}>{status.text}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={
              hasBuildingGroup || hasLandlordGroup
                ? "inline-flex h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
                : "inline-flex h-10 items-center justify-center rounded-md border border-[#BFDBFE] bg-white px-3 text-sm font-semibold text-[#0F5FD7] hover:bg-[#EFF6FF]"
            }
            onClick={() => onOpenZaloModal({ mode: "building-list", buildingId: group.building.id })}
            type="button"
          >
            {hasBuildingGroup ? "Gửi Zalo căn này" : hasLandlordGroup ? "Gửi bằng nhóm tổng" : "Gửi Zalo căn này"}
          </button>
          <BuildingZaloInlineEditor
            buildingId={group.building.id}
            groupName={group.building.zalo_group_name}
            groupUrl={group.building.zalo_group_url}
            triggerLabel={hasBuildingGroup ? "Sửa nhóm" : "Nhập nhóm riêng"}
          />
        </div>
      </div>
    </article>
  );
}

function RoomSummary({ room }: { room: SellListGroup["rooms"][number] | SellListClosedRoom }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-slate-950">Phòng {room.room_code}</p>
        <StatusBadge status={room.status} />
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {formatCurrencyVnd(room.rent_price)} · Cọc {formatCurrencyVnd(room.deposit_amount)} ·{" "}
        {formatArea(room.area_m2)}
        {room.status === "coming_soon" && room.available_from
          ? ` · ${roomStatusLabels.coming_soon} ${formatDate(room.available_from)}`
          : ""}
        {room.min_lease_months ? ` · Tối thiểu ${room.min_lease_months} tháng` : ""}
      </p>
    </div>
  );
}

function CloseRequestNotice({
  request
}: {
  request: SellListGroup["rooms"][number]["pending_close_request"];
}) {
  if (!request) {
    return null;
  }

  const brokerName = request.broker?.full_name;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        Môi giới báo đã chốt
      </span>
      <p className="mt-2 text-sm font-medium text-amber-950">
        {brokerName ? `Môi giới ${brokerName} báo phòng này đã chốt.` : "Có môi giới báo phòng này đã chốt."}
      </p>
      {request.broker?.phone ? (
        <p className="mt-1 text-xs text-amber-800">SĐT môi giới: {request.broker.phone}</p>
      ) : null}
      {request.broker_note ? (
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-amber-900">Ghi chú: {request.broker_note}</p>
      ) : null}
    </div>
  );
}

function EmptySellState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center">
      <p className="text-sm font-medium text-slate-600">{text}</p>
    </div>
  );
}

function shortAddress(building: SellListGroup["building"]) {
  return [building.address, building.district].filter(Boolean).join(", ");
}

function getBuildingZaloStatus(hasBuildingGroup: boolean, hasLandlordGroup: boolean) {
  if (hasBuildingGroup) {
    return {
      className: "text-[#0F5FD7]",
      text: "Đã có nhóm Zalo riêng"
    };
  }

  if (hasLandlordGroup) {
    return {
      className: "text-amber-700",
      text: "Chưa có nhóm riêng, sẽ dùng nhóm Zalo tổng"
    };
  }

  return {
    className: "text-red-700",
    text: "Chưa có link Zalo"
  };
}

function getBuildingZaloPayload({
  activeBuildingGroup,
  groups,
  landlordGroupUrl,
  modalState,
}: {
  activeBuildingGroup: SellListGroup | null | undefined;
  groups: SellListGroup[];
  landlordGroupUrl?: string | null;
  modalState: ZaloModalState;
}): BuildingZaloPayload | null {
  if (modalState?.mode !== "building-list") {
    return null;
  }

  if (modalState.buildingId === ALL_BUILDINGS_ZALO_ID) {
    return {
      buildingName: "Tất cả căn đang sell",
      district: null,
      zaloGroupUrl: landlordGroupUrl ?? null,
      rooms: groups.flatMap((group) =>
        group.rooms.map((room) => toZaloRoom(room, group.building.name, group.building.district))
      ),
    };
  }

  if (!activeBuildingGroup) {
    return null;
  }

  return {
    buildingName: activeBuildingGroup.building.name,
    district: activeBuildingGroup.building.district,
    zaloGroupUrl: activeBuildingGroup.building.zalo_group_url ?? landlordGroupUrl ?? null,
    rooms: activeBuildingGroup.rooms.map((room) =>
      toZaloRoom(room, activeBuildingGroup.building.name, activeBuildingGroup.building.district)
    ),
  };
}

function toZaloRoom(
  room: SellListGroup["rooms"][number] | SellListClosedRoom,
  buildingName: string,
  district?: string | null
): ZaloRoom {
  return {
    id: room.id,
    roomCode: room.room_code || room.title || "Chưa rõ",
    rentPrice: toNullableNumber(room.rent_price),
    depositAmount: toNullableNumber(room.deposit_amount),
    status: room.status,
    isNewVacant: isFreshWithin24Hours(room.updated_at) || isFreshWithin24Hours(room.created_at),
    district: district ?? null,
    buildingName,
    areaM2: toNullableNumber(room.area_m2),
    highlights: parseHighlights(room.strengths),
  };
}

function getLandlordShareId(landlordSlug?: string | null, landlordId?: string | null) {
  const slug = landlordSlug?.trim();

  if (slug) {
    return slug;
  }

  const id = landlordId?.trim();
  return id ? `u-${id.replaceAll("-", "")}` : "";
}

function getShareLink(shareId?: string) {
  const origin = getCurrentPublicOrigin();
  const path = shareId ? `/s/rooms/${encodeURIComponent(shareId)}` : "/s/rooms";
  const url = `${origin}${path}`;

  return {
    url,
    displayUrl: url.replace(/^https?:\/\//, ""),
  };
}

function getCurrentPublicOrigin() {
  return getSiteUrl();
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function parseHighlights(value: string | null | undefined) {
  if (!value?.trim()) {
    return undefined;
  }

  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isFreshWithin24Hours(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const time = new Date(value).getTime();

  if (!Number.isFinite(time)) {
    return false;
  }

  return Date.now() - time <= 24 * 60 * 60 * 1000;
}

function dedupeRecentlyClosedRooms(rooms: SellListClosedRoom[]) {
  const newestByRoom = new Map<string, SellListClosedRoom>();

  for (const room of rooms) {
    const current = newestByRoom.get(room.id);

    if (!current || new Date(room.closed_at).getTime() > new Date(current.closed_at).getTime()) {
      newestByRoom.set(room.id, room);
    }
  }

  return [...newestByRoom.values()].sort(
    (left, right) => new Date(right.closed_at).getTime() - new Date(left.closed_at).getTime()
  );
}

function closedRoomKey(room: SellListClosedRoom, index: number) {
  return room.status_log_id ?? `${room.id}-${room.closed_at ?? room.updated_at ?? index}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
