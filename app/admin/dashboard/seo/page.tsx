import { SeoPageView } from "@/features/seo-intelligence/components/seo-page-view";
import { seoModuleMeta } from "@/server/command-center/modules/seo/meta";
import { loadCommandCenterModule } from "@/server/command-center/registry";

export const revalidate = seoModuleMeta.revalidate;

export default async function Page() {
  const data = await loadCommandCenterModule("seo");
  return <SeoPageView data={data} />;
}
