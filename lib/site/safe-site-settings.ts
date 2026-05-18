import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";
import { getCachedSiteSettings } from "@/lib/site/site-settings-cache";
import {
  DEFAULT_SITE_SETTINGS,
  getSiteSettings,
} from "@/lib/site/queries";
import { getSiteSettingsViaSupabase } from "@/lib/site/public-site-supabase";
import type { SiteSettingsData } from "@/lib/site/types";

/** 公開版型：CF Worker 僅 Supabase REST；其餘環境 cache + Prisma */
export async function getSafeSiteSettings(): Promise<SiteSettingsData> {
  if (isCfPublicRuntime()) {
    try {
      return await getSiteSettingsViaSupabase();
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  }

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
