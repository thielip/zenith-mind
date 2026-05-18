import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import type { AdSlotPublic } from "@/lib/site/ad-slots";
import type { SiteLocale } from "@/lib/site/types";

export async function getActiveAdSlotPrisma(
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
