import { getPublicReadRepository } from "@/lib/public-content/get-repository";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site/queries";
import type { SiteSettingsData } from "@/lib/site/types";

/** 公開版型設定（CF→Supabase、Vercel→Prisma cache） */
export async function getSafeSiteSettings(): Promise<SiteSettingsData> {
  try {
    const repo = await getPublicReadRepository();
    return repo.getSiteSettings();
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
