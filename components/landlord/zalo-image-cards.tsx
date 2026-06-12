"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toPng } from "html-to-image";
import { rebaseInternalUrlsToBrowserOrigin } from "@/lib/client-public-url";

const BROKER_LINK_LABEL = "Xem thông tin chi tiết phòng trống";

export type RoomStatus =
  | "available"
  | "coming_soon"
  | "reserved"
  | "rented"
  | "hidden"
  | string;

export type ZaloRoom = {
  id: string;
  roomCode: string;
  rentPrice?: number | null;
  depositAmount?: number | null;
  status?: RoomStatus | null;
  isNewVacant?: boolean;
  district?: string | null;
  buildingName: string;
  areaM2?: number | null;
  highlights?: string[];
};

export type BuildingZaloPayload = {
  buildingName: string;
  district?: string | null;
  zaloGroupUrl?: string | null;
  rooms: ZaloRoom[];
};

export type ZaloImageCardMode = "building-list" | "push-room" | "closed-room";

function formatMoney(value?: number | null) {
  if (!value) return "Chưa nhập";
  return `${value.toLocaleString("vi-VN")}đ`;
}

function statusLabel(status?: string | null) {
  if (status === "available") return "Đang trống";
  if (status === "coming_soon") return "Sắp trống";
  if (status === "reserved") return "Đang giữ cọc";
  if (status === "rented") return "Đã thuê";
  if (status === "hidden") return "Tạm ẩn";
  return "Đang trống";
}

function slugFileName(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function RoomRow({ room }: { room: ZaloRoom }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0">
      <div className="text-xl font-black tracking-tight text-blue-900">
        {room.roomCode}
      </div>

      <div>
        <div className="text-lg font-black text-blue-900">
          {formatMoney(room.rentPrice)}
          {room.rentPrice ? "/tháng" : ""}
        </div>

        <div className="mt-1 text-sm font-medium text-slate-500">
          {room.depositAmount ? `Cọc ${formatMoney(room.depositAmount)}` : "Chưa nhập cọc"}
          {room.areaM2 ? ` · ${room.areaM2} m²` : ""}
        </div>
      </div>
    </div>
  );
}

function ImageCardShell({
  tone,
  chip,
  title,
  subtitle,
  children,
}: {
  tone: "blue" | "amber";
  chip: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const isAmber = tone === "amber";

  return (
    <div className="w-[720px] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
      <div className={isAmber ? "h-2 bg-amber-400" : "h-2 bg-blue-700"} />

      <div className="border-b border-slate-100 px-8 py-7">
        <div className="mb-5">
          <span
            className={
              isAmber
                ? "inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-amber-700"
                : "inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-700"
            }
          >
            {chip}
          </span>
        </div>

        <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950">
          {title}
        </h2>

        {subtitle ? (
          <p className="mt-2 text-base font-medium text-slate-500">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="space-y-6 px-8 py-7">{children}</div>

      <div className="border-t border-slate-100 bg-slate-50 px-8 py-5">
        <div className="text-center text-xs font-semibold text-slate-400">
          Kho Phòng Realtime
        </div>
      </div>
    </div>
  );
}

function BrokerLinkBlock({ displayUrl }: { displayUrl: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
      <div className="text-sm font-bold text-slate-500">
        {BROKER_LINK_LABEL}
      </div>
      <div className="mt-1 break-all text-xl font-black tracking-tight text-slate-950">
        {displayUrl}
      </div>
    </div>
  );
}

function BuildingListImageCard({
  payload,
  shareDisplayUrl,
}: {
  payload: BuildingZaloPayload;
  shareDisplayUrl?: string | null;
}) {
  const newRooms = payload.rooms.filter((room) => room.isNewVacant);
  const normalRooms = payload.rooms.filter((room) => !room.isNewVacant);

  return (
    <ImageCardShell
      tone="blue"
      chip="Danh sách phòng"
      title="Phòng trống mới cập nhật"
      subtitle={`${payload.buildingName}${payload.district ? ` · ${payload.district}` : ""}`}
    >
      <div className="grid grid-cols-2 gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <div className="rounded-3xl bg-white px-5 py-4">
          <div className="text-sm font-bold text-slate-500">Đang sell</div>
          <div className="mt-1 text-4xl font-black tracking-tight text-blue-700">
            {payload.rooms.length}
          </div>
        </div>

        <div className="rounded-3xl bg-white px-5 py-4">
          <div className="text-sm font-bold text-slate-500">Mới trống</div>
          <div className="mt-1 text-4xl font-black tracking-tight text-blue-700">
            {newRooms.length}
          </div>
        </div>
      </div>

      {newRooms.length ? (
        <div>
          <div className="mb-3 text-sm font-black uppercase tracking-wide text-blue-900">
            Phòng mới trống
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {newRooms.map((room) => (
              <RoomRow key={`new-${room.id}`} room={room} />
            ))}
          </div>
        </div>
      ) : null}

      {normalRooms.length ? (
        <div>
          <div className="mb-3 text-sm font-black uppercase tracking-wide text-blue-900">
            Phòng trống
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {normalRooms.map((room) => (
              <RoomRow key={`normal-${room.id}`} room={room} />
            ))}
          </div>
        </div>
      ) : null}

      {shareDisplayUrl ? <BrokerLinkBlock displayUrl={shareDisplayUrl} /> : null}
    </ImageCardShell>
  );
}

function PushRoomImageCard({
  room,
  shareDisplayUrl,
}: {
  room: ZaloRoom;
  shareDisplayUrl?: string | null;
}) {
  const highlights =
    room.highlights && room.highlights.length
      ? room.highlights
      : ["Giá tốt trong căn", "Phù hợp khách ở 1-2 người", "Có thể xem phòng trong ngày"];

  return (
    <ImageCardShell
      tone="blue"
      chip="Đẩy lại phòng"
      title={`Đẩy lại phòng ${room.roomCode}`}
      subtitle={`${room.buildingName}${room.district ? ` · ${room.district}` : ""}`}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Giá thuê
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {formatMoney(room.rentPrice)}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Tiền cọc
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {formatMoney(room.depositAmount)}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Trạng thái
          </div>
          <div className="mt-2 text-xl font-black text-slate-950">
            {statusLabel(room.status)}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Khu vực
          </div>
          <div className="mt-2 text-xl font-black text-slate-950">
            {room.district || "Chưa nhập"}
          </div>
        </div>
      </div>

      {highlights.length ? (
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4">
          <div className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
            Điểm nổi bật
          </div>

          <div className="space-y-2">
            {highlights.map((item) => (
              <div key={item} className="flex gap-3 text-base font-medium text-slate-700">
                <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-blue-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {shareDisplayUrl ? <BrokerLinkBlock displayUrl={shareDisplayUrl} /> : null}
    </ImageCardShell>
  );
}

function ClosedRoomImageCard({ room }: { room: ZaloRoom }) {
  return (
    <ImageCardShell
      tone="amber"
      chip="Thông báo"
      title={`${room.roomCode} đã chốt`}
      subtitle={room.buildingName}
    >
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-6">
        <div className="text-4xl font-black tracking-tight text-slate-950">
          Phòng {room.roomCode}
        </div>

        <div className="mt-2 text-lg font-black text-amber-800">
          Căn {room.buildingName}
        </div>

        <div className="mt-6 border-t border-amber-200 pt-5 text-xl font-black text-amber-900">
          Đã chốt. Cám ơn các bạn.
        </div>
      </div>
    </ImageCardShell>
  );
}

export function ZaloImageCardModal({
  open,
  mode,
  buildingPayload,
  room,
  zaloGroupUrl,
  shareUrl,
  shareDisplayUrl,
  onClose,
}: {
  open: boolean;
  mode: ZaloImageCardMode | null;
  buildingPayload?: BuildingZaloPayload | null;
  room?: ZaloRoom | null;
  zaloGroupUrl?: string | null;
  shareUrl?: string | null;
  shareDisplayUrl?: string | null;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (open) {
      setStatusMessage(null);
      setCopiedImage(false);
      setCopiedLink(false);
    }
  }, [open, mode, room?.id, shareUrl]);

  if (!open || !mode) return null;

  const isClosedRoom = mode === "closed-room";
  const activeTitle = isClosedRoom ? "Báo chốt phòng" : "Gửi Zalo bằng ảnh + link";
  const activeSubtitle = isClosedRoom
    ? "Copy ảnh card báo chốt rồi dán vào nhóm Zalo."
    : "Copy ảnh card trước, sau đó copy link chi tiết để dán dưới ảnh trong Zalo.";
  const filename =
    mode === "building-list" && buildingPayload
      ? `zalo-card-${slugFileName(buildingPayload.buildingName)}.png`
      : room
        ? `zalo-card-${slugFileName(room.roomCode)}.png`
        : "zalo-card.png";

  async function createCardPngDataUrl() {
    if (!cardRef.current) {
      throw new Error("Missing card ref");
    }

    return toPng(cardRef.current, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
    });
  }

  async function handleCopyCardImage() {
    try {
      setIsWorking(true);
      const dataUrl = await createCardPngDataUrl();
      await copyImageToClipboard(dataUrl);
      setCopiedImage(true);
      setStatusMessage("Đã copy ảnh card. Hãy dán ảnh vào nhóm Zalo.");
    } catch {
      try {
        const dataUrl = await createCardPngDataUrl();
        downloadDataUrl(dataUrl, filename);
        setStatusMessage("Trình duyệt không hỗ trợ copy ảnh. Đã tải ảnh để bạn gửi vào Zalo.");
      } catch {
        setStatusMessage("Không tạo được ảnh. Vui lòng thử lại.");
      }
    } finally {
      setIsWorking(false);
    }
  }

  async function handleCopyDetailLink() {
    if (!shareUrl) {
      setStatusMessage("Chưa có link chi tiết để copy.");
      return;
    }

    try {
      await copyTextToClipboard(buildZaloLinkText(shareUrl));
      setCopiedLink(true);
      setStatusMessage("Đã copy link chi tiết. Hãy dán link dưới ảnh trong Zalo.");
    } catch {
      setStatusMessage("Không copy được link. Vui lòng copy thủ công.");
    }
  }

  function openZaloGroup() {
    window.open(zaloGroupUrl || "https://zalo.me", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-[860px] overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">{activeTitle}</h2>
            <p className="text-sm text-slate-500">
              {activeSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>

        <div className="max-h-[64vh] overflow-auto bg-slate-100 p-5">
          <div className="flex justify-center">
            <div ref={cardRef}>
              {mode === "building-list" && buildingPayload ? (
                <BuildingListImageCard payload={buildingPayload} shareDisplayUrl={shareDisplayUrl} />
              ) : null}

              {mode === "push-room" && room ? (
                <PushRoomImageCard room={room} shareDisplayUrl={shareDisplayUrl} />
              ) : null}

              {mode === "closed-room" && room ? <ClosedRoomImageCard room={room} /> : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="mb-3 text-sm font-black text-slate-950">
              {isClosedRoom ? "Gửi báo chốt vào Zalo" : "Cách gửi vào Zalo"}
            </div>

            <div className="space-y-1 text-sm font-medium text-slate-600">
              {isClosedRoom ? (
                <p>Copy ảnh card và dán vào nhóm Zalo.</p>
              ) : (
                <>
                  <p>1. Copy ảnh card và dán vào nhóm Zalo.</p>
                  <p>2. Copy link chi tiết và dán ngay dưới ảnh.</p>
                </>
              )}
            </div>

            <div className={isClosedRoom ? "mt-4 grid gap-3 md:grid-cols-2" : "mt-4 grid gap-3 md:grid-cols-3"}>
              <button
                type="button"
                onClick={handleCopyCardImage}
                disabled={isWorking}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isWorking ? "Đang xử lý..." : "Copy ảnh card"}
              </button>

              {!isClosedRoom ? (
                <button
                  type="button"
                  onClick={handleCopyDetailLink}
                  disabled={!shareUrl}
                  className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-800 transition hover:bg-blue-100 disabled:opacity-60"
                >
                  Copy link chi tiết
                </button>
              ) : null}

              <button
                type="button"
                onClick={openZaloGroup}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Mở Zalo nhóm
              </button>
            </div>

            <div className="mt-3 space-y-1 text-xs font-semibold text-slate-500">
              {!isClosedRoom ? (
                <p>Dán ảnh trước, sau đó dán link dưới ảnh để môi giới bấm xem chi tiết.</p>
              ) : null}
              {copiedImage ? <p className="text-emerald-700">✓ Đã copy ảnh card</p> : null}
              {copiedLink ? <p className="text-emerald-700">✓ Đã copy link chi tiết</p> : null}
            </div>

            {statusMessage ? (
              <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                {statusMessage}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

async function copyImageToClipboard(dataUrl: string) {
  const imageBlob = await dataUrlToBlob(dataUrl);

  if (!("ClipboardItem" in window) || !navigator.clipboard?.write) {
    throw new Error("Clipboard image is not supported");
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": imageBlob,
    }),
  ]);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function buildZaloLinkText(url: string) {
  return `${BROKER_LINK_LABEL}:\n${url}`;
}

async function copyTextToClipboard(text: string) {
  const resolvedText = rebaseInternalUrlsToBrowserOrigin(text);

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(resolvedText);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = resolvedText;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}
