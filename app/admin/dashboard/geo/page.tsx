import { loadGeoPayload } from "@/server/command-center/load-geo";
import { GeoPageView } from "@/features/geo-intelligence/components/geo-page-view";

export const revalidate = 60;

export default async function Page() {
  const data = await loadGeoPayload();
  return <GeoPageView data={data} />;
}
