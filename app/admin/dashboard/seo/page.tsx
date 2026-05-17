import { loadSeoPayload } from "@/server/command-center/load-seo";
import { SeoPageView } from "@/features/seo-intelligence/components/seo-page-view";

export const revalidate = 60;

export default async function Page() {
  const data = await loadSeoPayload();
  return <SeoPageView data={data} />;
}
