import { AlertTriangle } from "lucide-react";
import { submitRoomReport } from "@/app/broker/actions";

type BrokerRoomReportPanelProps = {
  roomId: string;
};

const reportOptions = [
  { label: "Phòng đã thuê", value: "rented" },
  { label: "Sai giá", value: "wrong_price" },
  { label: "Sai ảnh", value: "wrong_images" },
  { label: "Sai thông tin", value: "wrong_info" },
  { label: "Khác", value: "other" }
];

export function BrokerRoomReportPanel({ roomId }: BrokerRoomReportPanelProps) {
  const formAction = submitRoomReport.bind(null, roomId);

  return (
    <section className="rounded-md border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-amber-700" aria-hidden />
        <h3 className="text-base font-bold text-slate-950">Báo sai thông tin</h3>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Gửi phản hồi để admin/chủ nhà kiểm tra lại dữ liệu phòng.
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Loại báo lỗi
          </span>
          <select
            className="h-11 w-full rounded-md border border-amber-200 bg-white px-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
            defaultValue=""
            name="report_type"
            required
          >
            <option value="" disabled>
              Chọn loại báo lỗi
            </option>
            {reportOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mô tả thêm
          </span>
          <textarea
            className="min-h-24 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
            name="message"
            placeholder="Ví dụ: chủ báo đã thuê tối qua, ảnh không đúng phòng, giá mới là..."
          />
        </label>

        <button
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800"
          type="submit"
        >
          Gửi báo lỗi
        </button>
      </form>
    </section>
  );
}
