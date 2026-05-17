import { loadWarRoomPayload } from "@/server/command-center/load-war-room";
import { WarRoomView } from "@/features/war-room/components/war-room-view";

export const revalidate = 60;

export default async function WarRoomPage() {
  const data = await loadWarRoomPayload();
  return <WarRoomView data={data} />;
}
