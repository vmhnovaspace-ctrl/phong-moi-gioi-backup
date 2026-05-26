import Link from "next/link";
import {
  AdminMetricCard,
  AdminPageHeader
} from "@/components/admin/admin-ui";
import { getAdminDashboardMetrics } from "@/lib/admin/queries";

export default async function AdminPage() {
  const metrics = await getAdminDashboardMetrics();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Tổng quan dữ liệu vận hành để chuẩn bị review MVP flow sau Module 10."
        title="Tổng quan hệ thống"
      />

      <QuickLinks />

      <MetricSection title="User">
        <AdminMetricCard label="Tổng user" value={metrics.users.total} tone="teal" />
        <AdminMetricCard label="Admin" value={metrics.users.byRole.admin} />
        <AdminMetricCard label="Chủ nhà" value={metrics.users.byRole.landlord} tone="green" />
        <AdminMetricCard label="Môi giới" value={metrics.users.byRole.broker} tone="blue" />
        <AdminMetricCard label="Chờ duyệt" value={metrics.users.byStatus.pending} tone="amber" />
        <AdminMetricCard label="Đang hoạt động" value={metrics.users.byStatus.active} tone="green" />
        <AdminMetricCard label="Đã khóa" value={metrics.users.byStatus.blocked} tone="red" />
      </MetricSection>

      <MetricSection title="Căn nhà">
        <AdminMetricCard label="Tổng căn nhà" value={metrics.buildings.total} tone="teal" />
        <AdminMetricCard label="Hiển thị" value={metrics.buildings.byVisibility.visible} tone="green" />
        <AdminMetricCard label="Đã ẩn" value={metrics.buildings.byVisibility.hidden} tone="dark" />
      </MetricSection>

      <MetricSection title="Phòng">
        <AdminMetricCard label="Tổng phòng" value={metrics.rooms.total} tone="teal" />
        <AdminMetricCard label="Đang trống" value={metrics.rooms.byStatus.available} tone="green" />
        <AdminMetricCard label="Sắp trống" value={metrics.rooms.byStatus.coming_soon} tone="blue" />
        <AdminMetricCard label="Đang giữ cọc" value={metrics.rooms.byStatus.reserved} tone="amber" />
        <AdminMetricCard label="Đã thuê" value={metrics.rooms.byStatus.rented} />
        <AdminMetricCard label="Tạm ẩn" value={metrics.rooms.byStatus.hidden} tone="dark" />
      </MetricSection>

      <MetricSection title="Report">
        <AdminMetricCard label="Tổng report" value={metrics.reports.total} tone="teal" />
        <AdminMetricCard label="Mới" value={metrics.reports.byStatus.open} tone="red" />
        <AdminMetricCard label="Đang xử lý" value={metrics.reports.byStatus.reviewing} tone="amber" />
        <AdminMetricCard label="Đã xử lý" value={metrics.reports.byStatus.resolved} tone="green" />
        <AdminMetricCard label="Từ chối" value={metrics.reports.byStatus.rejected} />
      </MetricSection>
    </div>
  );
}

function QuickLinks() {
  const links = [
    { href: "/admin/users", label: "Quản lý users" },
    { href: "/admin/buildings", label: "Xem căn nhà" },
    { href: "/admin/rooms", label: "Xem phòng" },
    { href: "/admin/reports", label: "Xử lý reports" }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {links.map((link) => (
        <Link
          className="flex min-h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-teal-700 hover:text-teal-800"
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function MetricSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}
