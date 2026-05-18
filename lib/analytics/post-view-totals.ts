/**
 * 文章／首頁瀏覽量：讀取 v_post_view_totals / v_site_view_totals（DailyAggregate + 當日增量）
 * 禁止對 page_views 做 COUNT(*) 全表掃描。
 */
import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";
import {
  supabaseRestWithFallback,
  type SupabaseFetchCache,
} from "@/lib/db/supabase-rest";
import type { SiteLocale } from "@/lib/site/types";

const VIEW_STATS_CACHE: SupabaseFetchCache = {
  kind: "public",
  revalidate: 3600,
  tags: ["page-view-stats", "posts"],
};

type PostTotalRow = {
  post_id: string;
  /** 舊 migration 欄位名 */
  total_views?: number;
  /** 目前 Supabase view 實際欄位名 */
  view_count?: number;
};
type SiteTotalRow = {
  locale: string;
  total_views?: number;
  view_count?: number;
};

function readViewCount(row: { total_views?: number; view_count?: number }): number {
  return Number(row.view_count ?? row.total_views) || 0;
}

export async function fetchPostViewTotalsMap(
  postIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (postIds.length === 0) return map;

  if (isCfPublicRuntime()) {
    const inList = postIds.map((id) => `"${id}"`).join(",");
    const rows = await supabaseRestWithFallback<PostTotalRow[]>(
      "v_post_view_totals",
      {
        select: "post_id,view_count",
        post_id: `in.(${inList})`,
      },
      [],
      undefined,
      VIEW_STATS_CACHE
    );
    for (const row of rows) {
      map.set(row.post_id, readViewCount(row));
    }
    return map;
  }

  const { prisma } = await import("@/infrastructure/db/prisma");
  const grouped = await prisma.dailyAggregate.groupBy({
    by: ["postId"],
    where: { postId: { in: postIds } },
    _sum: { views: true },
  });

  for (const row of grouped) {
    map.set(row.postId, row._sum.views ?? 0);
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todayRows = await prisma.pageView.groupBy({
    by: ["postId"],
    where: {
      postId: { in: postIds },
      createdAt: { gte: todayStart },
    },
    _count: { _all: true },
  });

  for (const row of todayRows) {
    if (!row.postId) continue;
    map.set(row.postId, (map.get(row.postId) ?? 0) + row._count._all);
  }

  return map;
}

export async function fetchPostViewTotal(postId: string): Promise<number> {
  const map = await fetchPostViewTotalsMap([postId]);
  return map.get(postId) ?? 0;
}

export async function fetchSiteViewTotal(locale: SiteLocale): Promise<number> {
  if (isCfPublicRuntime()) {
    const rows = await supabaseRestWithFallback<SiteTotalRow[]>(
      "v_site_view_totals",
      {
        select: "view_count",
        locale: `eq.${locale}`,
        limit: "1",
      },
      [],
      undefined,
      {
        kind: "public",
        revalidate: 3600,
        tags: ["page-view-stats", "homepage-stats"],
      }
    );
    return rows[0] ? readViewCount(rows[0]) : 0;
  }

  const { prisma } = await import("@/infrastructure/db/prisma");

  const hist = await prisma.siteDailyAggregate.aggregate({
    where: { locale },
    _sum: { views: true },
  });

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const today = await prisma.pageView.count({
    where: { postId: null, locale, createdAt: { gte: todayStart } },
  });

  return (hist._sum.views ?? 0) + today;
}
