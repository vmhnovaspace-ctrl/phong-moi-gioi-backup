import { ImageResponse } from "next/og";
import { getShareRoomsData, type ShareRoomsRoom } from "@/lib/share/rooms-share";

export const alt = "Xem thông tin chi tiết phòng trống";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type ShareRoomsOgImageProps = {
  params: Promise<{ shareId: string }>;
};

export default async function ShareRoomsOgImage({ params }: ShareRoomsOgImageProps) {
  const { shareId } = await params;
  const data = await getShareRoomsData(shareId);
  const rooms = data?.buildings.flatMap((building) =>
    building.rooms.map((room) => ({
      ...room,
      buildingName: building.name,
      district: building.district,
    })),
  ) ?? [];
  const newRooms = rooms.filter((room) => isFreshWithin24Hours(room.updated_at) || isFreshWithin24Hours(room.created_at));
  const normalRooms = rooms.filter((room) => !newRooms.some((newRoom) => newRoom.id === room.id));
  const primaryBuilding = data?.primaryBuilding ?? null;
  const subtitle = primaryBuilding
    ? [primaryBuilding.name, primaryBuilding.district].filter(Boolean).join(" · ")
    : "Kho Phòng Realtime";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#dbeafe",
          padding: 46,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 34,
            border: "2px solid #bfdbfe",
            background: "#ffffff",
            boxShadow: "0 22px 70px rgba(15, 23, 42, 0.16)",
          }}
        >
          <div style={{ height: 12, width: "100%", display: "flex", background: "#0F5FD7" }} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "34px 44px 24px",
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            <div
              style={{
                alignSelf: "flex-start",
                display: "flex",
                borderRadius: 999,
                border: "2px solid #bfdbfe",
                background: "#eff6ff",
                padding: "10px 16px",
                color: "#0F5FD7",
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: 1.2,
              }}
            >
              DANH SÁCH PHÒNG
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 18,
              }}
            >
              <div
                style={{
                  color: "#020617",
                  fontSize: 56,
                  fontWeight: 900,
                  lineHeight: 1.02,
                }}
              >
                Phòng trống mới cập nhật
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: "#475569",
                  fontSize: 29,
                  fontWeight: 700,
                }}
              >
                {subtitle}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              gap: 24,
              padding: "28px 44px 24px",
            }}
          >
            <div
              style={{
                width: 270,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <StatBox label="Đang sell" value={rooms.length} />
              <StatBox label="Mới trống" value={newRooms.length} />
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <RoomSection label="Phòng mới trống" rooms={newRooms.slice(0, 2)} />
              <RoomSection label="Phòng trống" rooms={normalRooms.slice(0, 3)} />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              borderTop: "2px solid #e2e8f0",
              background: "#f8fafc",
              padding: "18px 44px",
              color: "#64748b",
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            Kho Phòng Realtime
          </div>
        </div>
      </div>
    ),
    size,
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 26,
        border: "2px solid #dbeafe",
        background: "#eff6ff",
        padding: 22,
      }}
    >
      <div style={{ color: "#475569", fontSize: 22, fontWeight: 800 }}>{label}</div>
      <div style={{ marginTop: 4, color: "#0F5FD7", fontSize: 64, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function RoomSection({
  label,
  rooms,
}: {
  label: string;
  rooms: Array<ShareRoomsRoom & { buildingName?: string; district?: string | null }>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          marginBottom: 8,
          color: "#1e3a8a",
          fontSize: 19,
          fontWeight: 900,
          letterSpacing: 0.8,
        }}
      >
        {label.toUpperCase()}
      </div>
      <div
        style={{
          minHeight: 68,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 22,
          border: "2px solid #e2e8f0",
          background: "#ffffff",
        }}
      >
        {rooms.length ? (
          rooms.map((room) => <RoomRow key={`${label}-${room.id}`} room={room} />)
        ) : (
          <div
            style={{
              display: "flex",
              padding: "20px 22px",
              color: "#94a3b8",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            Chưa có phòng trong nhóm này
          </div>
        )}
      </div>
    </div>
  );
}

function RoomRow({
  room,
}: {
  room: ShareRoomsRoom & { buildingName?: string; district?: string | null };
}) {
  const roomCode = room.room_code || room.title || "Chưa rõ";
  const detail = [
    room.deposit_amount ? `Cọc ${formatMoney(room.deposit_amount)}` : "Chưa nhập cọc",
    room.area_m2 ? `${formatNumber(room.area_m2)} m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        borderBottom: "2px solid #f1f5f9",
        padding: "16px 22px",
      }}
    >
      <div style={{ width: 112, color: "#1e3a8a", fontSize: 31, fontWeight: 900 }}>{roomCode}</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ color: "#1e3a8a", fontSize: 27, fontWeight: 900 }}>
          {formatMoney(room.rent_price)}
          {room.rent_price ? "/tháng" : ""}
        </div>
        <div style={{ marginTop: 2, color: "#64748b", fontSize: 20, fontWeight: 700 }}>{detail}</div>
      </div>
    </div>
  );
}

function formatMoney(value?: number | string | null) {
  const numberValue = toNumber(value);
  return numberValue ? `${numberValue.toLocaleString("vi-VN")}đ` : "Chưa nhập";
}

function formatNumber(value?: number | string | null) {
  const numberValue = toNumber(value);
  return numberValue ? numberValue.toLocaleString("vi-VN") : "";
}

function toNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isFreshWithin24Hours(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) && Date.now() - time <= 24 * 60 * 60 * 1000;
}
