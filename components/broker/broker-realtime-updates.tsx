"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  Bell,
  Building2,
  CircleDollarSign,
  Home,
  RefreshCcw,
  RotateCw,
  Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrencyVnd, roomStatusLabels } from "@/lib/landlord/format";
import type { RoomStatus } from "@/lib/landlord/types";

type RealtimeRow = Record<string, unknown>;

type NotificationKind = "building" | "new_room" | "price" | "status" | "update";

type RealtimeNotification = {
  dedupeKey?: string;
  id: string;
  badge: string;
  body: string;
  createdAt: number;
  highlighted: boolean;
  kind: NotificationKind;
  title: string;
};

type RoomSnapshotRow = {
  id: string;
  rent_price: number;
  room_code: string;
  status: RoomStatus;
  title: string | null;
  updated_at: string;
  visibility: "visible" | "hidden";
};

type RoomSnapshot = Pick<
  RoomSnapshotRow,
  "id" | "rent_price" | "room_code" | "status" | "title" | "updated_at"
>;

const MAX_NOTIFICATIONS = 20;
const POLL_INTERVAL_MS = 10_000;
const SELLABLE_ROOM_STATUSES = new Set(["available", "coming_soon"]);
const SNAPSHOT_STORAGE_KEY = "broker-visible-room-snapshot";

const badgeClasses: Record<NotificationKind, string> = {
  building: "border-sky-200 bg-sky-50 text-sky-700",
  new_room: "border-emerald-200 bg-emerald-50 text-emerald-700",
  price: "border-violet-200 bg-violet-50 text-violet-700",
  status: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
  update: "border-slate-200 bg-slate-50 text-slate-700"
};

const badgeLabels: Record<NotificationKind, string> = {
  building: "Căn nhà",
  new_room: "Phòng mới",
  price: "Giá",
  status: "Trạng thái",
  update: "Cập nhật"
};

export function BrokerRealtimeUpdates() {
  const router = useRouter();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [pollVersion, setPollVersion] = useState(0);
  const [, forceTick] = useState(0);
  const notifiedKeysRef = useRef(new Set<string>());
  const snapshotRef = useRef<Map<string, RoomSnapshot>>(new Map());

  function pushNotification(notification: RealtimeNotification) {
    if (notification.dedupeKey) {
      if (notifiedKeysRef.current.has(notification.dedupeKey)) {
        return;
      }

      notifiedKeysRef.current.add(notification.dedupeKey);
    }

    setHasUpdate(true);
    setNotifications((current) => [
      notification,
      ...current.map((item) => ({ ...item, highlighted: false }))
    ].slice(0, MAX_NOTIFICATIONS));
  }

  useEffect(() => {
    const interval = window.setInterval(() => forceTick((tick) => tick + 1), 30_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function handleStatusLog(payload: RealtimePostgresChangesPayload<RealtimeRow>) {
      const row = payload.new as RealtimeRow;
      const roomId = stringValue(row.room_id);
      const newStatus = stringValue(row.new_status) as RoomStatus | null;

      if (newStatus && !isSellableStatus(newStatus)) {
        pushNotification(buildRoomLeftInventoryNotification());
        return;
      }
      const roomLabel = roomId ? await getRoomLabel(roomId) : "Một phòng";

      pushNotification({
        badge: badgeLabels.status,
        body: newStatus && newStatus in roomStatusLabels
          ? `${roomLabel} vừa chuyển sang ${roomStatusLabels[newStatus]}`
          : `${roomLabel} vừa đổi trạng thái`,
        createdAt: Date.now(),
        highlighted: true,
        id: crypto.randomUUID(),
        kind: "status",
        title: roomLabel
      });
    }

    function handleRoom(payload: RealtimePostgresChangesPayload<RealtimeRow>) {
      const row = (payload.new ?? payload.old) as RealtimeRow;
      const oldRow = payload.old as RealtimeRow;
      const status = stringValue(row.status);
      const oldStatus = stringValue(oldRow.status);

      if (status && !isSellableStatus(status)) {
        if (oldStatus && isSellableStatus(oldStatus) && oldStatus !== status) {
          pushNotification(buildRoomLeftInventoryNotification());
        }

        return;
      }

      const roomLabel = roomName(row);
      const kind = roomNotificationKind(payload.eventType, row, oldRow);

      pushNotification({
        badge: badgeLabels[kind],
        body: roomNotificationBody(kind, payload.eventType, row, oldRow),
        createdAt: Date.now(),
        highlighted: true,
        id: crypto.randomUUID(),
        kind,
        title: roomLabel
      });
    }

    function handleBuilding(payload: RealtimePostgresChangesPayload<RealtimeRow>) {
      const row = (payload.new ?? payload.old) as RealtimeRow;
      const buildingName = stringValue(row.name) || "Một căn nhà";

      pushNotification({
        badge: badgeLabels.building,
        body: `${buildingName} vừa có cập nhật`,
        createdAt: Date.now(),
        highlighted: true,
        id: crypto.randomUUID(),
        kind: "building",
        title: buildingName
      });
    }

    const channel = supabase
      .channel("broker-realtime-updates-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, handleRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "buildings" }, handleBuilding)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_status_logs" },
        (payload) => {
          void handleStatusLog(payload);
        }
      )
      .subscribe();

    async function getRoomLabel(roomId: string) {
      const { data } = await supabase
        .from("rooms")
        .select("room_code, title")
        .eq("id", roomId)
        .maybeSingle<{ room_code: string; title: string | null }>();

      return data ? data.title || `Phòng ${data.room_code}` : "Một phòng";
    }

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let stopped = false;

    async function syncVisibleRooms() {
      const { data, error } = await supabase
        .from("rooms")
        .select(
          "id, room_code, title, rent_price, status, updated_at, visibility, buildings!inner(id, visibility)"
        )
        .eq("visibility", "visible")
        .eq("buildings.visibility", "visible")
        .in("status", ["available", "coming_soon"])
        .order("updated_at", { ascending: false })
        .limit(500)
        .returns<RoomSnapshotRow[]>();

      if (stopped || error) {
        return;
      }

      const nextSnapshot = new Map((data ?? []).map((row) => [row.id, toRoomSnapshot(row)]));
      const previousSnapshot = snapshotRef.current.size > 0
        ? snapshotRef.current
        : readStoredSnapshot();

      if (previousSnapshot.size > 0) {
        for (const room of nextSnapshot.values()) {
          const previous = previousSnapshot.get(room.id);

          if (!previous) {
            pushSnapshotNotification("new_room", room);
            continue;
          }

          if (previous.status !== room.status) {
            pushSnapshotNotification("status", room);
            continue;
          }

          if (previous.rent_price !== room.rent_price) {
            pushSnapshotNotification("price", room);
          }
        }

        for (const previous of previousSnapshot.values()) {
          if (!nextSnapshot.has(previous.id)) {
            pushNotification(buildRoomLeftInventoryNotification(previous.id));
          }
        }
      }

      snapshotRef.current = nextSnapshot;
      writeStoredSnapshot(nextSnapshot);
    }

    function pushSnapshotNotification(kind: NotificationKind, room: RoomSnapshot) {
      pushNotification({
        badge: badgeLabels[kind],
        body: snapshotNotificationBody(kind, room),
        createdAt: Date.now(),
        dedupeKey: roomSnapshotDedupeKey(kind, room),
        highlighted: true,
        id: crypto.randomUUID(),
        kind,
        title: room.title || `Phòng ${room.room_code}`
      });
    }

    void syncVisibleRooms();
    const interval = window.setInterval(() => {
      void syncVisibleRooms();
    }, POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [pollVersion]);

  const visibleNotifications = useMemo(() => notifications, [notifications]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <Bell className="mt-0.5 size-5 text-[#0F5FD7]" aria-hidden />
          <div>
            <h2 className="text-base font-bold text-slate-950">Thông báo cập nhật</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Feed realtime tạm thời trong phiên môi giới hiện tại.
            </p>
          </div>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0F5FD7] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#0B4FB5] disabled:cursor-wait disabled:opacity-70"
          disabled={isPending}
          onClick={() => {
            startTransition(() => {
              router.refresh();
              setPollVersion((version) => version + 1);
              setHasUpdate(false);
              setNotifications((current) =>
                current.map((item) => ({ ...item, highlighted: false }))
              );
            });
          }}
          type="button"
        >
          <RefreshCcw className="size-4" aria-hidden />
          {isPending ? "Đang tải..." : hasUpdate ? "Tải dữ liệu mới" : "Làm mới kho phòng"}
        </button>
      </div>

      {hasUpdate ? (
        <div className="border-b border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm font-bold text-[#0B3B82]">
          Có cập nhật mới, bấm "Tải dữ liệu mới" để làm mới kho phòng.
        </div>
      ) : null}

      {visibleNotifications.length > 0 ? (
        <div className="max-h-80 overflow-y-auto">
          {visibleNotifications.map((item) => (
            <article
              className={`border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 ${
                item.highlighted ? "bg-[#EFF6FF]" : "bg-white"
              }`}
              key={item.id}
            >
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-500">
                  <NotificationIcon kind={item.kind} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClasses[item.kind]}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{item.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{relativeTime(item.createdAt)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center">
          <Sparkles className="mx-auto size-8 text-slate-300" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-slate-950">
            Chưa có cập nhật mới trong phiên này.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Khi chủ nhà đổi phòng/căn, thông báo sẽ xuất hiện tại đây.
          </p>
        </div>
      )}
    </section>
  );
}

function NotificationIcon({ kind }: { kind: NotificationKind }) {
  if (kind === "building") {
    return <Building2 className="size-4" aria-hidden />;
  }

  if (kind === "price") {
    return <CircleDollarSign className="size-4" aria-hidden />;
  }

  if (kind === "new_room") {
    return <Home className="size-4" aria-hidden />;
  }

  if (kind === "status") {
    return <RotateCw className="size-4" aria-hidden />;
  }

  return <Bell className="size-4" aria-hidden />;
}

function buildRoomLeftInventoryNotification(roomId?: string): RealtimeNotification {
  return {
    badge: badgeLabels.status,
    body: "Một phòng vừa rời khỏi danh sách môi giới đang sell.",
    createdAt: Date.now(),
    dedupeKey: roomId ? `room:${roomId}:left_inventory` : undefined,
    highlighted: true,
    id: crypto.randomUUID(),
    kind: "status",
    title: "Kho phòng thay đổi"
  };
}

function isSellableStatus(status: string): status is "available" | "coming_soon" {
  return SELLABLE_ROOM_STATUSES.has(status);
}

function toRoomSnapshot(row: RoomSnapshotRow): RoomSnapshot {
  return {
    id: row.id,
    rent_price: row.rent_price,
    room_code: row.room_code,
    status: row.status,
    title: row.title,
    updated_at: row.updated_at
  };
}

function readStoredSnapshot() {
  if (typeof window === "undefined") {
    return new Map<string, RoomSnapshot>();
  }

  try {
    const raw = window.sessionStorage.getItem(SNAPSHOT_STORAGE_KEY);
    const rows = raw ? (JSON.parse(raw) as RoomSnapshot[]) : [];
    return new Map(rows.map((row) => [row.id, row]));
  } catch {
    return new Map<string, RoomSnapshot>();
  }
}

function writeStoredSnapshot(snapshot: Map<string, RoomSnapshot>) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    SNAPSHOT_STORAGE_KEY,
    JSON.stringify(Array.from(snapshot.values()))
  );
}

function roomSnapshotDedupeKey(kind: NotificationKind, room: RoomSnapshot) {
  if (kind === "price") {
    return `room:${room.id}:price:${room.rent_price}`;
  }

  if (kind === "status") {
    return `room:${room.id}:status:${room.status}`;
  }

  return `room:${room.id}:${kind}:${room.updated_at}`;
}

function snapshotNotificationBody(kind: NotificationKind, room: RoomSnapshot) {
  const label = room.title || `PhÃ²ng ${room.room_code}`;

  if (kind === "new_room") {
    return `${label} vá»«a Ä‘Æ°á»£c thÃªm vÃ o kho`;
  }

  if (kind === "price") {
    return `${label} vá»«a Ä‘á»•i giÃ¡: ${formatCurrencyVnd(room.rent_price)}`;
  }

  if (kind === "status") {
    return `${label} vá»«a chuyá»ƒn sang ${roomStatusLabels[room.status]}`;
  }

  return `${label} vá»«a Ä‘Æ°á»£c cáº­p nháº­t thÃ´ng tin`;
}

function roomNotificationKind(
  eventType: string,
  row: RealtimeRow,
  oldRow: RealtimeRow
): NotificationKind {
  if (eventType === "INSERT") {
    return "new_room";
  }

  if (numberValue(row.rent_price) !== null && numberValue(oldRow.rent_price) !== null) {
    if (numberValue(row.rent_price) !== numberValue(oldRow.rent_price)) {
      return "price";
    }
  }

  if (stringValue(row.status) && stringValue(oldRow.status)) {
    if (stringValue(row.status) !== stringValue(oldRow.status)) {
      return "status";
    }
  }

  return "update";
}

function roomNotificationBody(
  kind: NotificationKind,
  eventType: string,
  row: RealtimeRow,
  oldRow: RealtimeRow
) {
  const label = roomName(row);

  if (kind === "new_room" || eventType === "INSERT") {
    return `${label} vừa được thêm vào kho`;
  }

  if (kind === "price") {
    return `${label} vừa đổi giá: ${formatCurrencyVnd(numberValue(row.rent_price))}`;
  }

  if (kind === "status") {
    const status = stringValue(row.status) as RoomStatus | null;
    return status && status in roomStatusLabels
      ? `${label} vừa chuyển sang ${roomStatusLabels[status]}`
      : `${label} vừa đổi trạng thái`;
  }

  return `${label} vừa được cập nhật thông tin`;
}

function roomName(row: RealtimeRow) {
  return stringValue(row.title) || (stringValue(row.room_code) ? `Phòng ${stringValue(row.room_code)}` : "Một phòng");
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function relativeTime(timestamp: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 10) {
    return "vừa xong";
  }

  if (seconds < 60) {
    return `${seconds} giây trước`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} phút trước`;
  }

  const hours = Math.floor(minutes / 60);

  return `${hours} giờ trước`;
}
