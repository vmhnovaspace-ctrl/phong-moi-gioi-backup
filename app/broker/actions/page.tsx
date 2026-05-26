import { BrokerActionsView } from "@/components/broker/broker-actions-view";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerActionWorkspaceRooms } from "@/lib/broker/queries";

export default async function BrokerActionsPage() {
  const profile = await requireRole(["broker"]);
  const rooms = await getBrokerActionWorkspaceRooms(profile.id);

  return <BrokerActionsView rooms={rooms} />;
}
