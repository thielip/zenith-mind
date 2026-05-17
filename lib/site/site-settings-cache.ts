import { unstable_cache } from "next/cache";
import { getSiteSettings } from "@/lib/site/queries";
import type { SiteSettingsData } from "@/lib/site/types";

/** 全站版型設定：CMS 儲存後以 revalidateTag('site-settings') 更新 */
export function getCachedSiteSettings(): Promise<SiteSettingsData> {
  return unstable_cache(
    async () => getSiteSettings(),
    ["site-settings-v1"],
    { revalidate: 3600, tags: ["site-settings"] }
  )();
}
