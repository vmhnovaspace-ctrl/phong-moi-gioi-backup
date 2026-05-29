import { Bookmark, CheckCircle2, ClipboardList, Megaphone, Send } from "lucide-react";
import { updateBrokerRoomAction } from "@/app/broker/actions";
import { BrokerCloseRequestPanel } from "@/components/broker/broker-close-request-panel";
import type { BrokerRoomActionState, BrokerRoomCloseRequestState } from "@/lib/broker/types";
import type { RoomStatus } from "@/lib/landlord/types";

type BrokerRoomActionsPanelProps = {
  action: BrokerRoomActionState | null;
  closeRequest: BrokerRoomCloseRequestState | null;
  roomId: string;
  roomStatus: RoomStatus;
};

export function BrokerRoomActionsPanel({
  action,
  closeRequest,
  roomId,
  roomStatus
}: BrokerRoomActionsPanelProps) {
  const formAction = updateBrokerRoomAction.bind(null, roomId);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <ClipboardList className="size-4 text-[#0F5FD7]" aria-hidden />
        <h3 className="text-base font-bold text-slate-950">Hành động của tôi</h3>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Dữ liệu này là riêng của bạn, không sửa thông tin phòng của chủ nhà.
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        <div className="grid gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <input
              className="size-4 accent-[#0F5FD7]"
              defaultChecked={Boolean(action?.is_saved)}
              name="is_saved"
              type="checkbox"
            />
            <Bookmark className="size-4 text-slate-400" aria-hidden />
            {action?.is_saved ? "Đang theo dõi" : "Theo dõi phòng"}
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <input
              className="size-4 accent-[#0F5FD7]"
              defaultChecked={Boolean(action?.sent_to_customer)}
              name="sent_to_customer"
              type="checkbox"
            />
            <Send className="size-4 text-slate-400" aria-hidden />
            Đã gửi khách
          </label>
        </div>

        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checklist đăng tin</p>
          <ActionCheckbox
            defaultChecked={Boolean(action?.posted_chotot)}
            label="Đã đăng Chợ Tốt"
            name="posted_chotot"
          />
          <ActionCheckbox
            defaultChecked={Boolean(action?.posted_mogi)}
            label="Đã đăng Mogi"
            name="posted_mogi"
          />
          <ActionCheckbox
            defaultChecked={Boolean(action?.posted_facebook)}
            label="Đã đăng Facebook"
            name="posted_facebook"
          />
        </div>

        {action?.updated_at ? (
          <p className="text-xs text-slate-500">
            Cập nhật lần cuối:{" "}
            {new Intl.DateTimeFormat("vi-VN", {
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              month: "2-digit"
            }).format(new Date(action.updated_at))}
          </p>
        ) : null}

        <button
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#0F5FD7] px-4 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
          type="submit"
        >
          <CheckCircle2 className="mr-2 size-4" aria-hidden />
          Lưu hành động
        </button>
      </form>

      <div className="mt-4">
        <BrokerCloseRequestPanel
          closeRequest={closeRequest}
          roomId={roomId}
          roomStatus={roomStatus}
        />
      </div>
    </section>
  );
}

function ActionCheckbox({
  defaultChecked,
  label,
  name
}: {
  defaultChecked: boolean;
  label: string;
  name: "posted_chotot" | "posted_mogi" | "posted_facebook";
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
      <input className="size-4 accent-[#0F5FD7]" defaultChecked={defaultChecked} name={name} type="checkbox" />
      <Megaphone className="size-4 text-slate-400" aria-hidden />
      {label}
    </label>
  );
}
