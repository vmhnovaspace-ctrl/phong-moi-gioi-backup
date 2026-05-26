import Link from "next/link";
import { BrokerRoomDetail } from "@/components/broker/broker-room-detail";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerRoom } from "@/lib/broker/queries";

type BrokerRoomDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ actions?: string; report?: string }>;
};

export default async function BrokerRoomDetailPage({
  params,
  searchParams
}: BrokerRoomDetailPageProps) {
  const [{ id }, query, profile] = await Promise.all([params, searchParams, requireRole(["broker"])]);
  const room = await getBrokerRoom(id, profile.id);

  if (!room) {
    return (
      <section className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
        <h2 className="text-base font-semibold text-slate-950">
          Không tìm thấy phòng hoặc bạn không có quyền xem phòng này.
        </h2>
        <Link
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
          href="/broker/rooms"
        >
          Mở kho phòng
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {query.actions === "updated" ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          Đã cập nhật thao tác môi giới.
        </div>
      ) : null}
      {query.report === "sent" ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          Đã gửi báo sai thông tin.
        </div>
      ) : null}
      {query.report === "missing-type" || query.report === "missing-message" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          Vui lòng chọn loại báo lỗi. Nếu chọn “Khác”, hãy nhập thêm mô tả.
        </div>
      ) : null}
      <BrokerRoomDetail room={room} />
    </div>
  );
}
