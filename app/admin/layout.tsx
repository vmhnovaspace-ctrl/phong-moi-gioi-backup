import { RoleShell } from "@/components/dashboard/role-shell";
import { requireRole } from "@/lib/auth/profile";

export default async function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireRole(["admin"]);

  return (
    <RoleShell
      description="Quản lý user, căn nhà, phòng và report trong hệ thống."
      navItems={[
        { href: "/admin", label: "Tổng quan" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/buildings", label: "Căn nhà" },
        { href: "/admin/rooms", label: "Phòng" },
        { href: "/admin/reports", label: "Reports" }
      ]}
      profile={profile}
      title="Admin Dashboard"
    >
      {children}
    </RoleShell>
  );
}
