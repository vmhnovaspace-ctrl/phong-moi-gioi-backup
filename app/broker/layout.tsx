import { RoleShell } from "@/components/dashboard/role-shell";
import { requireRole } from "@/lib/auth/profile";

export default async function BrokerLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireRole(["broker"]);

  return (
    <RoleShell
      description="Xem và thao tác với phòng trống/sắp trống theo quyền môi giới."
      navItems={[
        { href: "/broker", label: "Dashboard" },
        { href: "/broker/rooms", label: "Kho phòng", hiddenOn: ["/broker"] },
        { href: "/broker/saved", label: "Phòng theo dõi", hiddenOn: ["/broker"] },
        { href: "/broker/actions", label: "Hành động" },
        { href: "/broker/send", label: "Gửi khách" }
      ]}
      profile={profile}
      title="Broker Dashboard"
    >
      {children}
    </RoleShell>
  );
}
