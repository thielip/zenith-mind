import { prisma } from "@/infrastructure/db/prisma";
import {
  buildSevenDaySeries,
  dateKey,
  lastNDaysUtc,
  utcDateOnly,
} from "@/lib/affiliate/click-stats";

export interface AffiliateLinkAdminRow {
  id: string;
  name: string;
  slug: string;
  targetUrl: string;
  platform: string;
  commission: string;
  isActive: boolean;
  clickCount: number;
  todayClicks: number;
  last7Days: number[];
}

export async function loadAffiliateLinksForAdmin(): Promise<AffiliateLinkAdminRow[]> {
  const links = await prisma.affiliateLink.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (links.length === 0) return [];

  const dayDates = lastNDaysUtc(7);
  const dayKeys = dayDates.map(dateKey);
  const rangeStart = dayDates[0] ?? utcDateOnly(new Date());
  const todayKey = dayKeys[dayKeys.length - 1] ?? dateKey(utcDateOnly(new Date()));

  const dailyRows = await prisma.affiliateLinkClickDaily.findMany({
    where: {
      affiliateLinkId: { in: links.map((l) => l.id) },
      date: { gte: rangeStart },
    },
  });

  const byLink = new Map<string, Map<string, number>>();
  for (const row of dailyRows) {
    const key = dateKey(row.date);
    let map = byLink.get(row.affiliateLinkId);
    if (!map) {
      map = new Map();
      byLink.set(row.affiliateLinkId, map);
    }
    map.set(key, row.clickCount);
  }

  return links.map((link) => {
    const dailyMap = byLink.get(link.id) ?? new Map<string, number>();
    return {
      id: link.id,
      name: link.name,
      slug: link.slug,
      targetUrl: link.targetUrl,
      platform: link.platform ?? "",
      commission: link.commission ?? "",
      isActive: link.isActive,
      clickCount: link.clickCount,
      todayClicks: dailyMap.get(todayKey) ?? 0,
      last7Days: buildSevenDaySeries(dailyMap, dayKeys),
    };
  });
}
