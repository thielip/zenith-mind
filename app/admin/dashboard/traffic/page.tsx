import { loadTrafficPayload } from "@/server/command-center/load-traffic";
import { TrafficPageView } from "@/features/traffic-intelligence/components/traffic-page-view";

export const revalidate = 60;

export default async function Page() {
  const data = await loadTrafficPayload();
  return <TrafficPageView data={data} />;
}
