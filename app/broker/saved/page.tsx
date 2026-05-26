import { BrokerSavedRoomsView } from "@/components/broker/broker-saved-rooms-view";
import { requireRole } from "@/lib/auth/profile";
import { getBrokerSavedRooms } from "@/lib/broker/queries";

export default async function BrokerSavedPage() {
  const profile = await requireRole(["broker"]);
  const rooms = await getBrokerSavedRooms(profile.id);

  return <BrokerSavedRoomsView rooms={rooms} />;
}
