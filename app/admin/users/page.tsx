import {
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  UserRoleBadge,
  UserStatusBadge,
  formatDateTime
} from "@/components/admin/admin-ui";
import { AdminActionSubmit } from "@/components/admin/admin-action-submit";
import { updateUserStatusFormAction } from "@/app/admin/actions";
import { requireRole } from "@/lib/auth/profile";
import { adminRoleLabels, adminUserStatusLabels } from "@/lib/admin/labels";
import { getAdminUsers, parseAdminUserFilters } from "@/lib/admin/queries";
import type { Profile, UserStatus } from "@/lib/auth/types";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const [params, currentAdmin] = await Promise.all([searchParams, requireRole(["admin"])]);
  const filters = parseAdminUserFilters(params);
  const data = await getAdminUsers(filters);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        description="Duyệt user mới, khóa tài khoản có vấn đề, và kiểm tra role/status hiện tại."
        title="Quản lý users"
      />
      <AdminNotice error={params.error} message={params.message} />
      <UserFilters filters={filters} />

      {data.users.length === 0 ? (
        <AdminEmptyState
          description="Không có user nào khớp bộ lọc hiện tại."
          title="Chưa có user để hiển thị"
        />
      ) : (
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
            Đang hiển thị {data.users.length.toLocaleString("vi-VN")} / {data.count.toLocaleString("vi-VN")} user gần nhất.
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Liên hệ</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.users.map((user) => (
                  <UserTableRow currentAdminId={currentAdmin.id} key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 lg:hidden">
            {data.users.map((user) => (
              <UserMobileCard currentAdminId={currentAdmin.id} key={user.id} user={user} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function UserFilters({ filters }: { filters: ReturnType<typeof parseAdminUserFilters> }) {
  return (
    <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px_auto]" action="/admin/users">
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tìm kiếm</span>
        <input
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.q ?? ""}
          name="q"
          placeholder="Tên, email, số điện thoại"
        />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.role ?? "all"}
          name="role"
        >
          <option value="all">Tất cả role</option>
          {(["admin", "landlord", "broker"] as const).map((role) => (
            <option key={role} value={role}>
              {adminRoleLabels[role]}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.status ?? "all"}
          name="status"
        >
          <option value="all">Tất cả status</option>
          {(["pending", "active", "blocked"] as const).map((status) => (
            <option key={status} value={status}>
              {adminUserStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button className="h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800" type="submit">
          Lọc
        </button>
        <a className="inline-flex h-11 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/admin/users">
          Xóa
        </a>
      </div>
    </form>
  );
}

function UserTableRow({ currentAdminId, user }: { currentAdminId: string; user: Profile }) {
  return (
    <tr className="align-top">
      <td className="px-4 py-4">
        <p className="font-semibold text-slate-950">{user.full_name || "Chưa có tên"}</p>
        <p className="mt-1 text-xs text-slate-500">{user.id}</p>
      </td>
      <td className="px-4 py-4 text-slate-700">
        <p>{user.phone || "Chưa có SĐT"}</p>
        <p className="mt-1 text-xs text-slate-500">{user.email || "Chưa có email"}</p>
      </td>
      <td className="px-4 py-4"><UserRoleBadge role={user.role} /></td>
      <td className="px-4 py-4"><UserStatusBadge status={user.status} /></td>
      <td className="px-4 py-4 text-slate-600">{formatDateTime(user.created_at)}</td>
      <td className="px-4 py-4 text-slate-600">{formatDateTime(user.updated_at)}</td>
      <td className="px-4 py-4">
        <UserActions currentAdminId={currentAdminId} user={user} />
      </td>
    </tr>
  );
}

function UserMobileCard({ currentAdminId, user }: { currentAdminId: string; user: Profile }) {
  return (
    <article className="space-y-3 p-4">
      <div>
        <p className="font-semibold text-slate-950">{user.full_name || "Chưa có tên"}</p>
        <p className="mt-1 text-sm text-slate-600">{user.phone || "Chưa có SĐT"}</p>
        <p className="mt-1 text-xs text-slate-500">{user.email || "Chưa có email"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <UserRoleBadge role={user.role} />
        <UserStatusBadge status={user.status} />
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày tạo</dt>
          <dd className="mt-1 text-slate-700">{formatDateTime(user.created_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cập nhật</dt>
          <dd className="mt-1 text-slate-700">{formatDateTime(user.updated_at)}</dd>
        </div>
      </dl>
      <UserActions currentAdminId={currentAdminId} user={user} />
    </article>
  );
}

function UserActions({ currentAdminId, user }: { currentAdminId: string; user: Profile }) {
  if (user.id === currentAdminId) {
    return <p className="text-sm font-medium text-slate-500">Không tự khóa chính mình</p>;
  }

  const actions: Array<{ label: string; status: UserStatus; variant?: "primary" | "danger" | "secondary" }> = [];

  if (user.status === "pending") {
    actions.push({ label: "Duyệt", status: "active", variant: "primary" });
    actions.push({ label: "Khóa", status: "blocked", variant: "danger" });
  } else if (user.status === "active") {
    actions.push({ label: "Khóa", status: "blocked", variant: "danger" });
  } else {
    actions.push({ label: "Mở khóa", status: "active", variant: "primary" });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <form action={updateUserStatusFormAction} key={action.label}>
          <input name="user_id" type="hidden" value={user.id} />
          <input name="status" type="hidden" value={action.status} />
          <AdminActionSubmit pendingText="Đang cập nhật..." variant={action.variant}>
            {action.label}
          </AdminActionSubmit>
        </form>
      ))}
    </div>
  );
}
