import { loadForecastPayload } from "@/server/command-center/load-forecast";
import { ForecastPageView } from "@/features/forecast-center/components/forecast-page-view";

export const revalidate = 60;

export default async function Page() {
  const data = await loadForecastPayload();
  return <ForecastPageView data={data} />;
}
