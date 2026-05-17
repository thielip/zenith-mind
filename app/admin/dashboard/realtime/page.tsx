import { loadRealtimePayload } from "@/server/command-center/load-realtime";
import { RealtimePageView } from "@/features/realtime-monitoring/components/realtime-page-view";

export const revalidate = 60;

export default async function Page() {
  const data = await loadRealtimePayload();
  return <RealtimePageView data={data} />;
}
