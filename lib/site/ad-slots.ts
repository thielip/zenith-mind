import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";
import { getActiveAdSlotViaSupabase } from "@/lib/site/public-site-supabase";
import type { SiteLocale } from "@/lib/site/types";

export interface AdSlotPublic {
  id: string;
  slotKey: string;
  locale: string;
  name: string;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  imageAlt: string;
  blurHash: string | null;
  href: string | null;
  aspectRatio: string | null;
  priority: number;
}

/**
 * 取得首頁等公開版位的廣告：優先語系，其次 locale=all。
 * CF Worker：Supabase REST；其餘：Prisma（動態 import）。
 */
export async function getActiveAdSlot(
  slotKey: string,
  locale: SiteLocale
): Promise<AdSlotPublic | null> {
  if (isCfPublicRuntime()) {
    try {
      return await getActiveAdSlotViaSupabase(slotKey, locale);
    } catch {
      return null;
    }
  }

  const { getActiveAdSlotPrisma } = await import("@/lib/site/ad-slots-prisma");
  return getActiveAdSlotPrisma(slotKey, locale);
}
