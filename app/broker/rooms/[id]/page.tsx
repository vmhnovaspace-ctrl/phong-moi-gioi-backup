import Link from "next/link";
import { BrokerRoomDetail } from "@/components/broker/broker-room-detail";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerRoom, getBrokerRoomCloseRequest } from "@/lib/broker/queries";
import type { BrokerRoomCloseRequestState } from "@/lib/broker/types";

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
    const closeRequest = await getBrokerRoomCloseRequest(id, profile.id);

    if (closeRequest) {
      return <CloseRequestOnlyState closeRequest={closeRequest} />;
    }

    return (
      <section className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
        <h2 className="text-base font-semibold text-slate-950">
          Không tìm thấy phòng hoặc bạn không có quyền xem phòng này.
        </h2>
        <Link
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-4 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
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
        <div className="rounded-md border border-[#A7F3D0] bg-[#ECFDF5] p-3 text-sm font-medium text-[#047857]">
          Đã cập nhật thao tác môi giới.
        </div>
      ) : null}
      {query.report === "sent" ? (
        <div className="rounded-md border border-[#A7F3D0] bg-[#ECFDF5] p-3 text-sm font-medium text-[#047857]">
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

function CloseRequestOnlyState({
  closeRequest
}: {
  closeRequest: BrokerRoomCloseRequestState;
}) {
  const content = closeRequestStatusContent(closeRequest);

  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 px-4 py-8 text-center">
      <h2 className="text-base font-black text-slate-950">{content.title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-amber-900">{content.description}</p>
      <Link
        className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-4 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
        href="/broker"
      >
        Về kho phòng
      </Link>
    </section>
  );
}

function closeRequestStatusContent(closeRequest: BrokerRoomCloseRequestState) {
  if (closeRequest.status === "approved") {
    return {
      description: "Chủ nhà đã chuyển phòng sang Đã thuê, nên phòng không còn nằm trong kho phòng đang sell.",
      title: "Chủ nhà đã xác nhận phòng đã chốt"
    };
  }

  if (closeRequest.status === "rejected") {
    return {
      description: "Chủ nhà đã từ chối báo chốt trước đó. Nếu phòng còn sell, bạn có thể mở lại từ kho phòng và gửi báo chốt mới.",
      title: "Chủ nhà đã từ chối báo chốt"
    };
  }

  if (closeRequest.status === "cancelled") {
    return {
      description: "Báo chốt trước đó đã hủy. Nếu phòng còn sell, bạn có thể gửi lại khi có thông tin mới.",
      title: "Báo chốt đã hủy"
    };
  }

  return {
    description: "Yêu cầu đã được gửi tới chủ nhà và đang chờ xác nhận.",
    title: "Đã gửi báo chốt"
  };
}
