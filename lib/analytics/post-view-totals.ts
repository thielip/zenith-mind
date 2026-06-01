/**
 * 瀏覽量：首頁直接數 page_views；文章可讀彙總 view 或日後再簡化。
 */
import { isPublicCfBackend } from "@/lib/public-content/runtime";
import {
  supabaseCount,
  supabaseRestWithFallback,
  type SupabaseFetchCache,
} from "@/lib/db/supabase-rest";
import type { SiteLocale } from "@/lib/site/types";

const VIEW_STATS_CACHE: SupabaseFetchCache = {
  kind: "public",
  revalidate: 3600,
  tags: ["page-view-stats", "posts"],
};

const HOMEPAGE_VIEWS_CACHE: SupabaseFetchCache = {
  kind: "public",
  revalidate: 60,
  tags: ["page-view-stats", "homepage-stats"],
};

type PostTotalRow = {
  post_id: string;
  view_count?: number;
  total_views?: number;
};

function readViewCount(row: { total_views?: number; view_count?: number }): number {
  return Number(row.view_count ?? row.total_views) || 0;
}

/** 首頁累計瀏覽：postId 為 null 的 page_views 筆數（最直覺、與 DB 一致） */
export async function fetchSiteViewTotal(locale: SiteLocale): Promise<number> {
  if (isPublicCfBackend()) {
    return supabaseCount(
      "page_views",
      { postId: "is.null", locale: `eq.${locale}` },
      HOMEPAGE_VIEWS_CACHE
    );
  }

  const { prisma } = await import("@/infrastructure/db/prisma");
  return prisma.pageView.count({
    where: { postId: null, locale },
  });
}

export async function fetchPostViewTotalsMap(
  postIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (postIds.length === 0) return map;

  if (isPublicCfBackend()) {
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
