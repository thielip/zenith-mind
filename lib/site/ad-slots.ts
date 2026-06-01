import { getPublicReadRepository } from "@/lib/public-content/get-repository";
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

/** 取得首頁等公開版位的廣告（PublicReadRepository 分派後端） */
export async function getActiveAdSlot(
  slotKey: string,
  locale: SiteLocale
): Promise<AdSlotPublic | null> {
  const repo = await getPublicReadRepository();
  return repo.getActiveAdSlot(slotKey, locale);
}
