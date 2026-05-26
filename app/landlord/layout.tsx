import { RoleShell } from "@/components/dashboard/role-shell";
import { requireRole } from "@/lib/auth/profile";

export default async function LandlordLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireRole(["landlord"]);

  return (
    <RoleShell
      description="Quản lý theo cấu trúc Chủ nhà -> Căn nhà -> Phòng."
      navItems={[
        { href: "/landlord", label: "Tổng quan" },
        { href: "/landlord/buildings", label: "Căn nhà" },
        { href: "/landlord/buildings/new", label: "Thêm căn" }
      ]}
      profile={profile}
      title="Dashboard chủ nhà"
    >
      {children}
    </RoleShell>
  );
}
