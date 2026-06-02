import { BrokerFollowingView } from "@/components/broker/broker-following-view";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerClosedRooms, getBrokerHandledCustomerInterestRooms, getBrokerSavedRooms } from "@/lib/broker/queries";
import type { BrokerClosedRoomPeriod } from "@/lib/broker/types";

type BrokerFollowingPageProps = {
  searchParams?: Promise<{ closed?: string }>;
};

const closedPeriods: BrokerClosedRoomPeriod[] = ["today", "week", "month"];

export default async function BrokerFollowingPage({ searchParams }: BrokerFollowingPageProps) {
  const profile = await requireRole(["broker"]);
  const params = await searchParams;
  const closedPeriod = closedPeriods.includes(params?.closed as BrokerClosedRoomPeriod)
    ? (params?.closed as BrokerClosedRoomPeriod)
    : "today";
  const [savedRooms, interestedRooms, closedRooms] = await Promise.all([
    getBrokerSavedRooms(profile.id),
    getBrokerHandledCustomerInterestRooms(profile.id),
    getBrokerClosedRooms(profile.id, closedPeriod)
  ]);

  return (
    <BrokerFollowingView
      closedPeriod={closedPeriod}
      closedRooms={closedRooms}
      interestedRooms={interestedRooms}
      savedRooms={savedRooms}
    />
  );
}
