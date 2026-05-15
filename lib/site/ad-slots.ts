import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
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
 */
export async function getActiveAdSlot(
  slotKey: string,
  locale: SiteLocale
): Promise<AdSlotPublic | null> {
  try {
    const row =
      (await prisma.adSlot.findFirst({
        where: { slotKey, isActive: true, locale },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      })) ??
      (await prisma.adSlot.findFirst({
        where: { slotKey, isActive: true, locale: "all" },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      }));

    if (!row) return null;

    return {
      id: row.id,
      slotKey: row.slotKey,
      locale: row.locale,
      name: row.name,
      imageUrl: row.imageUrl,
      imageWidth: row.imageWidth,
      imageHeight: row.imageHeight,
      imageAlt: row.imageAlt,
      blurHash: row.blurHash,
      href: row.href,
      aspectRatio: row.aspectRatio,
      priority: row.priority,
    };
  } catch (e) {
    // 尚未執行 migrate、或 DB 與 schema 不同步時，避免公開頁整頁 500
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2021"
    ) {
      if (process.env["NODE_ENV"] === "development") {
        console.warn(
          "[ad-slots] 資料表 ad_slots 不存在。請執行: npx prisma migrate deploy（本機可用 npm run db:migrate）"
        );
      }
      return null;
    }
    throw e;
  }
}
