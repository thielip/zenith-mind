import { getCachedSiteSettings } from "@/lib/site/site-settings-cache";
import {
  DEFAULT_SITE_SETTINGS,
  getSiteSettings,
} from "@/lib/site/queries";
import type { SiteSettingsData } from "@/lib/site/types";

/** 公開版型：cache + 任何 DB/Prisma 錯誤皆降級為預設值 */
export async function getSafeSiteSettings(): Promise<SiteSettingsData> {
  try {
    return await getCachedSiteSettings();
  } catch {
    try {
      return await getSiteSettings();
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  }
}
