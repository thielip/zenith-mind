import { SeoPageView } from "@/features/seo-intelligence/components/seo-page-view";
import { loadCommandCenterModule } from "@/server/command-center/registry";

/** 須為字面常數（Next.js segment config）；與 seoModuleMeta.revalidate 保持同步 */
export const revalidate = 60;

export default async function Page() {
  const data = await loadCommandCenterModule("seo");
  return <SeoPageView data={data} />;
}
