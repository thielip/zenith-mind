import { prisma } from "@/infrastructure/db/prisma";
import type { AiJobStatus, AiJobType } from "@prisma/client";

export interface DashboardAiJobRow {
  id: string;
  type: AiJobType;
  status: AiJobStatus;
  retryCount: number;
  createdAt: Date;
}

export interface DashboardDbSnapshot {
  postPublished: number;
  postDraft: number;
  affiliateActive: number;
  aiPending: number;
  recentAiJobs: DashboardAiJobRow[];
}

type DashboardCountsRow = {
  postPublished: number;
  postDraft: number;
  affiliateActive: number;
  aiPending: number;
};

/** 儀表板統計：1 次 SQL 彙總 + 1 次列表查詢（避免 4+ 並發 count 各開 transaction） */
export async function fetchDashboardDbSnapshot(): Promise<DashboardDbSnapshot> {
  const [countsRows, recentAiJobs] = await Promise.all([
    prisma.$queryRaw<DashboardCountsRow[]>`
      SELECT
        (SELECT COUNT(*)::int
         FROM "public"."posts"
         WHERE "status" = 'PUBLISHED'::"PostStatus"
           AND "deletedAt" IS NULL) AS "postPublished",
        (SELECT COUNT(*)::int
         FROM "public"."posts"
         WHERE "status" = 'DRAFT'::"PostStatus"
           AND "deletedAt" IS NULL) AS "postDraft",
        (SELECT COUNT(*)::int
         FROM "public"."affiliate_links"
         WHERE "isActive" = true) AS "affiliateActive",
        (SELECT COUNT(*)::int
         FROM "public"."ai_jobs"
         WHERE "status" = 'PENDING'::"AiJobStatus") AS "aiPending"
    `,
    prisma.aiJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        status: true,
        retryCount: true,
        createdAt: true,
      },
    }),
  ]);

  const counts = countsRows[0] ?? {
    postPublished: 0,
    postDraft: 0,
    affiliateActive: 0,
    aiPending: 0,
  };

  return { ...counts, recentAiJobs };
}
