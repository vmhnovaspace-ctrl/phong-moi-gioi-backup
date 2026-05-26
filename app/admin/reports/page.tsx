import Link from "next/link";
import {
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  ReportStatusBadge,
  ReportTypeBadge,
  RoomStatusBadge,
  VisibilityBadge,
  formatDateTime
} from "@/components/admin/admin-ui";
import { AdminActionSubmit } from "@/components/admin/admin-action-submit";
import { updateReportStatusFormAction } from "@/app/admin/actions";
import { adminReportStatusLabels, adminReportTypeLabels } from "@/lib/admin/labels";
import { getAdminReports, parseAdminReportFilters } from "@/lib/admin/queries";
import type { AdminReport, ReportStatus } from "@/lib/admin/types";

type AdminReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const params = await searchParams;
  const filters = parseAdminReportFilters(params);
  const data = await getAdminReports(filters);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        description="Xem phản hồi sai thông tin từ môi giới và cập nhật trạng thái xử lý."
        title="Quản lý reports"
      />
      <AdminNotice error={params.error} message={params.message} />
      <ReportFilters filters={filters} />

      {data.reports.length === 0 ? (
        <AdminEmptyState
          description="Không có report nào khớp bộ lọc hiện tại."
          title="Chưa có report để xử lý"
        />
      ) : (
        <section className="space-y-3">
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            Đang hiển thị {data.reports.length.toLocaleString("vi-VN")} / {data.count.toLocaleString("vi-VN")} report gần nhất.
          </p>
          {data.reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </section>
      )}
    </div>
  );
}

function ReportFilters({ filters }: { filters: ReturnType<typeof parseAdminReportFilters> }) {
  return (
    <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_190px_190px_auto]" action="/admin/reports">
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tìm kiếm</span>
        <input
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.q ?? ""}
          name="q"
          placeholder="Phòng, căn, chủ nhà, broker"
        />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.status ?? "all"}
          name="status"
        >
          <option value="all">Tất cả status</option>
          {(["open", "reviewing", "resolved", "rejected"] as const).map((status) => (
            <option key={status} value={status}>
              {adminReportStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loại report</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.reportType ?? "all"}
          name="reportType"
        >
          <option value="all">Tất cả loại</option>
          {(["rented", "wrong_price", "wrong_images", "wrong_info", "other"] as const).map((reportType) => (
            <option key={reportType} value={reportType}>
              {adminReportTypeLabels[reportType]}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button className="h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800" type="submit">
          Lọc
        </button>
        <a className="inline-flex h-11 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/admin/reports">
          Xóa
        </a>
      </div>
    </form>
  );
}

function ReportCard({ report }: { report: AdminReport }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <ReportTypeBadge reportType={report.report_type} />
            <ReportStatusBadge status={report.status} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-950">
              {report.room ? `Phòng ${report.room.room_code}` : "Phòng không còn truy cập được"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {report.message || "Broker không nhập mô tả thêm."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {report.room ? (
            <>
              <Link
                className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href={`/admin/rooms?q=${encodeURIComponent(report.room.room_code)}`}
              >
                Xem phòng
              </Link>
              <Link
                className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href={`/r/${report.room.public_slug}`}
              >
                Mở share
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
        <Info label="Căn nhà" value={report.room?.building?.name ?? "Không rõ căn"} />
        <Info label="Địa chỉ" value={report.room?.building?.address ?? "Không rõ địa chỉ"} />
        <Info label="Chủ nhà" value={report.room?.landlord?.full_name ?? "Không rõ chủ nhà"} />
        <Info label="Broker gửi" value={report.broker?.full_name ?? "Không rõ broker"} />
        <Info label="Broker liên hệ" value={report.broker?.phone ?? report.broker?.email ?? "Thiếu liên hệ"} />
        <Info label="Ngày tạo" value={formatDateTime(report.created_at)} />
        <Info label="Ngày xử lý" value={formatDateTime(report.resolved_at)} />
        <Info label="Admin xử lý" value={report.resolved_by_admin?.full_name ?? "Chưa có"} />
      </div>

      {report.room ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <RoomStatusBadge status={report.room.status} />
          <VisibilityBadge visibility={report.room.visibility} />
        </div>
      ) : null}

      <ReportActionForm report={report} />
    </article>
  );
}

function ReportActionForm({ report }: { report: AdminReport }) {
  const nextStatuses = allowedNextStatuses(report.status);

  return (
    <form action={updateReportStatusFormAction} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 lg:grid-cols-[180px_1fr_auto] lg:items-end">
      <input name="report_id" type="hidden" value={report.id} />
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cập nhật status</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={nextStatuses[0] ?? report.status}
          name="status"
        >
          {nextStatuses.length === 0 ? (
            <option value={report.status}>{adminReportStatusLabels[report.status]}</option>
          ) : (
            nextStatuses.map((status) => (
              <option key={status} value={status}>
                {adminReportStatusLabels[status]}
              </option>
            ))
          )}
        </select>
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin note</span>
        <textarea
          className="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={report.admin_note ?? ""}
          name="admin_note"
          placeholder="Ghi chú xử lý nội bộ"
        />
      </label>
      <AdminActionSubmit pendingText="Đang cập nhật..." variant="primary">
        Cập nhật report
      </AdminActionSubmit>
    </form>
  );
}

function allowedNextStatuses(status: ReportStatus): ReportStatus[] {
  if (status === "open") {
    return ["reviewing", "resolved"];
  }

  if (status === "reviewing") {
    return ["resolved", "rejected"];
  }

  return ["reviewing"];
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-700">{value}</dd>
    </div>
  );
}
