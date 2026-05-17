import { loadAeoPayload } from "@/server/command-center/load-aeo";
import { AeoPageView } from "@/features/aeo-intelligence/components/aeo-page-view";

export const revalidate = 60;

export default async function Page() {
  const data = await loadAeoPayload();
  return <AeoPageView data={data} />;
}
