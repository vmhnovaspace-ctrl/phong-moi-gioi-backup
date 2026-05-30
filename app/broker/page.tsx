import { BrokerInventoryView } from "@/components/broker/broker-inventory-view";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerInventory } from "@/lib/broker/queries";

export default async function BrokerPage() {
  const profile = await requireRole(["broker"]);
  const inventory = await getBrokerInventory({}, profile.id);

  return <BrokerInventoryView inventory={inventory} />;
}
