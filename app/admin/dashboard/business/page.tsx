import { loadBusinessPayload } from "@/server/command-center/load-business";
import { BusinessPageView } from "@/features/business-analytics/components/business-page-view";

export const revalidate = 60;

export default async function Page() {
  const data = await loadBusinessPayload();
  return <BusinessPageView data={data} />;
}
