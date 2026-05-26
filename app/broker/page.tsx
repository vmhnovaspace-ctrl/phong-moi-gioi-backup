import { BrokerDashboard } from "@/components/broker/broker-dashboard";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerDashboard } from "@/lib/broker/queries";

export default async function BrokerPage() {
  const profile = await requireRole(["broker"]);
  const dashboard = await getBrokerDashboard(profile.id);

  return <BrokerDashboard dashboard={dashboard} />;
}
