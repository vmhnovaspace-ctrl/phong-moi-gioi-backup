"use client";

import { useRef, useState, useTransition } from "react";
import type { RefObject } from "react";
import clsx from "clsx";
import { Check, Copy, Download, ExternalLink, Send, X, XCircle } from "lucide-react";
import { toPng } from "html-to-image";
import { recordRoomSellEventAction } from "@/app/landlord/actions";
import { formatArea, formatCurrencyVnd, formatDate, roomStatusLabels } from "@/lib/landlord/format";
import type { RoomSellEventType, RoomStatus } from "@/lib/landlord/types";

type ZaloPreviewRoom = {
  id: string;
  room_code: string;
  status: RoomStatus;
  rent_price: number;
  deposit_amount: number | null;
  area_m2: number | string | null;
  available_from?: string | null;
  strengths?: string | null;
};

type ZaloPreviewData =
  | {
      kind: "room_list";
      title?: string;
      buildingName?: string | null;
      rooms: ZaloPreviewRoom[];
    }
  | {
      kind: "room_push";
      buildingName?: string | null;
      room: ZaloPreviewRoom;
    }
  | {
      kind: "closed";
      buildingName?: string | null;
      room: Pick<ZaloPreviewRoom, "id" | "room_code">;
    };

type ZaloShareButtonProps = {
  label: string;
  text: string;
  eventType: RoomSellEventType;
  buildingId?: string;
  roomId?: string;
  zaloUrl?: string | null;
  noZaloMessage: string;
  className?: string;
  variant?: "primary" | "secondary";
  preview?: ZaloPreviewData;
};

type ShareState = "idle" | "copied" | "error";

const BROKER_ROOMS_DISPLAY_URL = "kho-phong.vn/broker/rooms";
const BROKER_ROOMS_URL = "https://kho-phong.vn/broker/rooms";

export function ZaloShareButton({
  buildingId,
  className,
  eventType,
  label,
  noZaloMessage,
  preview,
  roomId,
  text,
  variant = "secondary",
  zaloUrl
}: ZaloShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<ShareState>("idle");
  const [message, setMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [isPending, startTransition] = useTransition();
  const cardRef = useRef<HTMLElement>(null);
  const eventRecordedRef = useRef(false);
  const previewData = preview ?? fallbackPreview(text);
  const includeBrokerLink = previewData.kind !== "closed";
  const filename = `goi-zalo-${previewData.kind}-${roomId ?? buildingId ?? "kho-phong"}.png`;

  function openPreview() {
    setIsOpen(true);
    setState("idle");
    setMessage("");
    eventRecordedRef.current = false;
  }

  async function createCardPngDataUrl() {
    if (!cardRef.current) {
      throw new Error("Missing card ref");
    }

    return toPng(cardRef.current, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true
    });
  }

  async function handleCopyZaloPackage() {
    try {
      setIsWorking(true);
      setState("idle");
      setMessage("");

      const dataUrl = await createCardPngDataUrl();

      try {
        await copyZaloPackage({ dataUrl, includeBrokerLink });
        setState("copied");
        setMessage(
          includeBrokerLink
            ? "Đã copy gói Zalo. Hãy dán vào Zalo; nếu Zalo chỉ hiện ảnh, link vẫn nằm trong ảnh."
            : "Đã copy ảnh báo chốt. Hãy dán vào Zalo."
        );
        recordEvent();
        return;
      } catch {
        try {
          const imageBlob = await dataUrlToBlob(dataUrl);
          await copyImageToClipboard(imageBlob);
          setState("copied");
          setMessage(
            includeBrokerLink ? "Đã copy ảnh. Link xem thêm đã nằm trong ảnh." : "Đã copy ảnh báo chốt. Hãy dán vào Zalo."
          );
          recordEvent();
          return;
        } catch {
          downloadDataUrl(dataUrl, filename);
          setState("error");
          setMessage("Trình duyệt không hỗ trợ copy ảnh. Đã tải ảnh để bạn gửi vào Zalo.");
        }
      }
    } catch {
      setState("error");
      setMessage("Không tạo được ảnh card. Vui lòng thử lại.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleDownloadImage() {
    try {
      setIsWorking(true);
      const dataUrl = await createCardPngDataUrl();
      downloadDataUrl(dataUrl, filename);
      setState("idle");
      setMessage("Đã tải ảnh.");
    } catch {
      setState("error");
      setMessage("Không tạo được ảnh card. Vui lòng thử lại.");
    } finally {
      setIsWorking(false);
    }
  }

  function openZaloGroup() {
    if (!zaloUrl) {
      setMessage(noZaloMessage);
      return;
    }

    window.open(zaloUrl, "_blank", "noopener,noreferrer");
    recordEvent();
  }

  function recordEvent() {
    if (eventRecordedRef.current) {
      return;
    }

    eventRecordedRef.current = true;
    startTransition(async () => {
      const result = await recordRoomSellEventAction(eventType, { buildingId, roomId });

      if (result.error) {
        setMessage(`Chưa ghi nhận được lịch sử: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-1">
      <button
        className={clsx(
          "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70",
          variant === "primary"
            ? "bg-[#0F5FD7] text-white hover:bg-[#0B4FB5]"
            : "border border-[#BFDBFE] bg-white text-[#0F5FD7] hover:bg-[#EFF6FF]",
          className
        )}
        disabled={isPending}
        onClick={openPreview}
        type="button"
      >
        {zaloUrl ? <ExternalLink className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {label}
      </button>

      {isOpen ? (
        <ZaloPreviewModal
          cardRef={cardRef}
          isWorking={isWorking}
          onClose={() => setIsOpen(false)}
          onCopy={handleCopyZaloPackage}
          onDownload={handleDownloadImage}
          onOpenZalo={openZaloGroup}
          preview={previewData}
          state={state}
          statusMessage={message}
        />
      ) : null}
    </div>
  );
}

function ZaloPreviewModal({
  cardRef,
  isWorking,
  onClose,
  onCopy,
  onDownload,
  onOpenZalo,
  preview,
  state,
  statusMessage
}: {
  cardRef: RefObject<HTMLElement | null>;
  isWorking: boolean;
  onClose: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onOpenZalo: () => void;
  preview: ZaloPreviewData;
  state: ShareState;
  statusMessage: string;
}) {
  const isClosed = preview.kind === "closed";

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 px-0 sm:items-center sm:justify-center sm:px-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <h2 className="text-base font-bold text-slate-950">Ảnh gửi Zalo</h2>
          <button
            aria-label="Đóng"
            className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <p className="text-sm leading-6 text-slate-600">
            Bấm Copy gói Zalo, sau đó dán vào nhóm Zalo. Nếu Zalo chỉ hiện ảnh, link xem thêm đã nằm trong ảnh.
          </p>

          <article
            className={clsx(
              "rounded-md border p-4",
              isClosed ? "border-orange-200 bg-orange-50" : "border-[#BFDBFE] bg-[#EFF6FF]"
            )}
            ref={cardRef}
          >
            <PreviewCardBody preview={preview} />
            {!isClosed ? <BrokerLinkBlock /> : null}
          </article>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isWorking}
              onClick={onCopy}
              type="button"
            >
              {state === "copied" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {isWorking ? "Đang copy..." : "Copy gói Zalo"}
            </button>
            <button
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isWorking}
              onClick={onDownload}
              type="button"
            >
              <Download className="size-4" aria-hidden />
              Tải ảnh
            </button>
            <button
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={onOpenZalo}
              type="button"
            >
              <Send className="size-4" aria-hidden />
              Mở Zalo nhóm
            </button>
          </div>

          {statusMessage ? (
            <p className={clsx("text-xs leading-5", state === "error" ? "text-red-700" : "text-slate-600")}>
              {state === "error" ? <XCircle className="mr-1 inline size-3.5" aria-hidden /> : null}
              {statusMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PreviewCardBody({ preview }: { preview: ZaloPreviewData }) {
  if (preview.kind === "closed") {
    return (
      <div className="space-y-1 text-sm leading-6 text-orange-950">
        <h3 className="text-base font-bold text-orange-950">Báo chốt</h3>
        <p>Phòng {preview.room.room_code}</p>
        <p>Căn {preview.buildingName || "căn nhà"}</p>
        <p>Đã chốt. Cám ơn các bạn.</p>
      </div>
    );
  }

  if (preview.kind === "room_push") {
    return (
      <div className="space-y-3 text-sm leading-6 text-slate-800">
        <h3 className="text-base font-bold text-slate-950">Đẩy lại phòng</h3>
        <RoomLine room={preview.room} showStatus />
        {preview.buildingName ? <p className="font-medium text-slate-700">Căn {preview.buildingName}</p> : null}
        {preview.room.strengths ? (
          <div>
            <p className="font-semibold text-slate-900">Điểm nổi bật</p>
            <p>{preview.room.strengths}</p>
          </div>
        ) : null}
      </div>
    );
  }

  const newRooms = preview.rooms.filter((room) => room.status === "coming_soon");
  const availableRooms = preview.rooms.filter((room) => room.status === "available");

  return (
    <div className="space-y-3 text-sm leading-6 text-slate-800">
      <h3 className="text-base font-bold text-slate-950">{preview.title || "Gửi danh sách phòng trống"}</h3>
      {preview.buildingName ? <p className="font-medium text-slate-700">Căn {preview.buildingName}</p> : null}
      <RoomSection title="Danh sách phòng mới trống" rooms={newRooms.length > 0 ? newRooms : preview.rooms.slice(0, 3)} />
      <RoomSection title="Phòng trống" rooms={availableRooms.length > 0 ? availableRooms : preview.rooms} />
    </div>
  );
}

function BrokerLinkBlock() {
  return (
    <div className="mt-4 rounded-md border border-[#BFDBFE] bg-white px-3 py-2 text-sm leading-6 text-[#0F5FD7]">
      <p className="font-bold">Xem thêm phòng trống</p>
      <p>{BROKER_ROOMS_DISPLAY_URL}</p>
    </div>
  );
}

function RoomSection({ rooms, title }: { rooms: ZaloPreviewRoom[]; title: string }) {
  return (
    <div>
      <p className="font-semibold text-slate-900">{title}</p>
      <div className="mt-1 space-y-1">
        {rooms.length > 0 ? rooms.map((room) => <RoomLine key={`${title}-${room.id}`} room={room} />) : <p>Chưa có phòng phù hợp.</p>}
      </div>
    </div>
  );
}

function RoomLine({ room, showStatus = false }: { room: ZaloPreviewRoom; showStatus?: boolean }) {
  return (
    <p>
      Phòng {room.room_code} · {formatCurrencyVnd(room.rent_price)} · {formatArea(room.area_m2)}
      {showStatus ? ` · ${roomStatusText(room)}` : ""}
    </p>
  );
}

function roomStatusText(room: Pick<ZaloPreviewRoom, "status" | "available_from">) {
  if (room.status === "coming_soon" && room.available_from) {
    return `${roomStatusLabels.coming_soon} ${formatDate(room.available_from)}`;
  }

  return roomStatusLabels[room.status];
}

function fallbackPreview(text: string): ZaloPreviewData {
  return {
    kind: "room_list",
    rooms: [],
    title: text.split("\n")[0] || "Gửi danh sách phòng trống"
  };
}

function dataUrlToBlob(dataUrl: string) {
  return fetch(dataUrl).then((response) => response.blob());
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function copyZaloPackage({ dataUrl, includeBrokerLink }: { dataUrl: string; includeBrokerLink: boolean }) {
  const imageBlob = await dataUrlToBlob(dataUrl);
  const brokerText = includeBrokerLink ? `Xem thêm phòng trống:\n${BROKER_ROOMS_URL}` : "";
  const escapedDataUrl = escapeHtml(dataUrl);
  const html = includeBrokerLink
    ? `
      <div>
        <img src="${escapedDataUrl}" alt="Kho phòng realtime" />
        <p>
          <strong>Xem thêm phòng trống:</strong><br />
          <a href="${BROKER_ROOMS_URL}">${BROKER_ROOMS_URL}</a>
        </p>
      </div>
    `
    : `
      <div>
        <img src="${escapedDataUrl}" alt="Kho phòng realtime" />
      </div>
    `;

  if (!("ClipboardItem" in window) || !navigator.clipboard?.write) {
    throw new Error("Rich clipboard is not supported");
  }

  const itemData: Record<string, Blob> = {
    "image/png": imageBlob,
    "text/html": new Blob([html], { type: "text/html" })
  };

  if (includeBrokerLink) {
    itemData["text/plain"] = new Blob([brokerText], { type: "text/plain" });
  }

  await navigator.clipboard.write([new ClipboardItem(itemData)]);
}

async function copyImageToClipboard(imageBlob: Blob) {
  if (!("ClipboardItem" in window) || !navigator.clipboard?.write) {
    throw new Error("Image clipboard is not supported");
  }

  await navigator.clipboard.write([new ClipboardItem({ "image/png": imageBlob })]);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
