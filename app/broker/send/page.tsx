import { BrokerSendToCustomerView } from "@/components/broker/broker-send-to-customer-view";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerSendToCustomerData } from "@/lib/broker/queries";

export default async function BrokerSendPage() {
  const profile = await requireRole(["broker"]);
  const data = await getBrokerSendToCustomerData(profile.id);

  return <BrokerSendToCustomerView packages={data.packages} rooms={data.rooms} />;
}
