import { RoleShell } from "@/components/dashboard/role-shell";
import { BrokerCustomerInterestRealtime } from "@/components/broker/broker-customer-interest-realtime";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerCustomerInterestUnreadCount } from "@/lib/broker/queries";

export default async function BrokerLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireRole(["broker"]);
  const unreadCustomerInterestCount = await getBrokerCustomerInterestUnreadCount(profile.id);

  return (
    <RoleShell
      description="Xem phòng trống/sắp trống, lưu phòng, copy tin đăng và báo chốt phòng."
      navItems={[
        { href: "/broker", label: "Kho phòng" },
        { href: "/broker/following", label: "Phòng theo dõi" },
        {
          badge: unreadCustomerInterestCount,
          href: "/broker/send",
          label: "Tìm phòng và Gửi khách"
        }
      ]}
      profile={profile}
      title="Kho phòng"
    >
      <BrokerCustomerInterestRealtime brokerId={profile.id} />
      {children}
    </RoleShell>
  );
}
