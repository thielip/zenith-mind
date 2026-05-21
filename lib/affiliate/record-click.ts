import { prisma } from "@/infrastructure/db/prisma";
import { utcDateOnly } from "@/lib/affiliate/click-stats";

/** 累計總點擊 + 當日 rollup（/go 轉址時呼叫） */
export async function recordAffiliateClick(linkId: string): Promise<void> {
  const date = utcDateOnly(new Date());
  await Promise.all([
    prisma.affiliateLink.update({
      where: { id: linkId },
      data: { clickCount: { increment: 1 } },
    }),
    prisma.affiliateLinkClickDaily.upsert({
      where: {
        affiliateLinkId_date: { affiliateLinkId: linkId, date },
      },
      create: { affiliateLinkId: linkId, date, clickCount: 1 },
      update: { clickCount: { increment: 1 } },
    }),
  ]);
}
