import { BrokerFollowingView } from "@/components/broker/broker-following-view";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerHandledCustomerInterestRooms, getBrokerSavedRooms } from "@/lib/broker/queries";

export default async function BrokerFollowingPage() {
  const profile = await requireRole(["broker"]);
  const [savedRooms, interestedRooms] = await Promise.all([
    getBrokerSavedRooms(profile.id),
    getBrokerHandledCustomerInterestRooms(profile.id)
  ]);

  return <BrokerFollowingView interestedRooms={interestedRooms} savedRooms={savedRooms} />;
}
