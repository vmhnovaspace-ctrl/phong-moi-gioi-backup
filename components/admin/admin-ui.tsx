import Link from "next/link";
import clsx from "clsx";
import type { UserRole, UserStatus } from "@/lib/auth/types";
import type { RoomStatus } from "@/lib/landlord/types";
import {
  adminReportStatusLabels,
  adminReportTypeLabels,
  adminRoleLabels,
  adminRoomStatusLabels,
  adminUserStatusLabels,
  adminVisibilityLabels
} from "@/lib/admin/labels";
import type { ReportStatus, ReportType, VisibilityStatus } from "@/lib/admin/types";

type BadgeTone = "blue" | "green" | "amber" | "red" | "slate" | "dark" | "teal";

const toneClasses: Record<BadgeTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  dark: "border-slate-300 bg-slate-800 text-white",
  green: "border-green-200 bg-green-50 text-green-700",
  red: "border-red-200 bg-red-50 text-red-700",
  slate: "border-slate-200 bg-slate-100 text-slate-600",
  teal: "border-teal-200 bg-teal-50 text-teal-700"
};

export function AdminBadge({ children, tone = "slate" }: { children: React.ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold leading-none",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

export function UserRoleBadge({ role }: { role: UserRole }) {
  const tone: Record<UserRole, BadgeTone> = {
    admin: "teal",
    broker: "blue",
    landlord: "green"
  };

  return <AdminBadge tone={tone[role]}>{adminRoleLabels[role]}</AdminBadge>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const tone: Record<UserStatus, BadgeTone> = {
    active: "green",
    blocked: "red",
    pending: "amber"
  };

  return <AdminBadge tone={tone[status]}>{adminUserStatusLabels[status]}</AdminBadge>;
}

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  const tone: Record<RoomStatus, BadgeTone> = {
    available: "green",
    coming_soon: "blue",
    hidden: "dark",
    rented: "slate",
    reserved: "amber"
  };

  return <AdminBadge tone={tone[status]}>{adminRoomStatusLabels[status]}</AdminBadge>;
}

export function VisibilityBadge({ visibility }: { visibility: VisibilityStatus }) {
  return (
    <AdminBadge tone={visibility === "visible" ? "green" : "dark"}>
      {adminVisibilityLabels[visibility]}
    </AdminBadge>
  );
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const tone: Record<ReportStatus, BadgeTone> = {
    open: "red",
    rejected: "slate",
    resolved: "green",
    reviewing: "amber"
  };

  return <AdminBadge tone={tone[status]}>{adminReportStatusLabels[status]}</AdminBadge>;
}

export function ReportTypeBadge({ reportType }: { reportType: ReportType }) {
  return <AdminBadge tone="blue">{adminReportTypeLabels[reportType]}</AdminBadge>;
}

export function AdminNotice({
  error,
  message
}: {
  error?: string | string[];
  message?: string | string[];
}) {
  const errorText = Array.isArray(error) ? error[0] : error;
  const messageText = Array.isArray(message) ? message[0] : message;

  if (!errorText && !messageText) {
    return null;
  }

  return (
    <div
      className={clsx(
        "rounded-xl border px-4 py-3 text-sm font-bold",
        errorText
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      )}
    >
      {errorText ?? messageText}
    </div>
  );
}

export function AdminEmptyState({
  actionHref,
  actionLabel,
  description,
  title
}: {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-bold text-white shadow-sm hover:bg-teal-800"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

export function AdminPageHeader({
  actions,
  description,
  title
}: {
  actions?: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminMetricCard({
  label,
  value,
  tone = "slate"
}: {
  label: string;
  value: number;
  tone?: BadgeTone;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={clsx("mt-2 text-2xl font-bold", metricToneClasses[tone])}>
        {value.toLocaleString("vi-VN")}
      </p>
    </div>
  );
}

const metricToneClasses: Record<BadgeTone, string> = {
  amber: "text-amber-700",
  blue: "text-blue-700",
  dark: "text-slate-900",
  green: "text-green-700",
  red: "text-red-700",
  slate: "text-slate-950",
  teal: "text-teal-700"
};

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
