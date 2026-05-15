// app/admin/dashboard/page.tsx — Admin 儀表板
// Cache 模式 B：no-store（即時數據）
// GA4 API 呼叫封裝於 infrastructure/ 層，獨立 revalidate:3600，不衝突

import type { Metadata } from "next";
import { prisma } from "@/infrastructure/db/prisma";
import {
  fetchBasicStatsLast7Days,
  fetchRealtimeActiveUsers,
  fetchTopPagesLast7Days,
  fetchTrafficTrend,
} from "@/infrastructure/ga4/reporting.client";
import TrafficChart from "@/components/admin/Dashboard/TrafficChart";
import StatCard     from "@/components/admin/Dashboard/StatCard";
import { env } from "@/env";
import { getGoogleIntegrationStatuses } from "@/lib/google/integration-status";
import { Activity, BrainCircuit, Eye, FileText, Link2, Users } from "lucide-react";

export const metadata: Metadata = { title: "儀表板 | Admin" };

// ⚠ Admin 後台：模式 B，不設 revalidate（即時數據）
// GA4 client 內部使用 fetch revalidate:3600，與此頁面隔離

export default async function DashboardPage() {
  // ── 快速統計（即時 DB 查詢）────────────────────────────
  const [
    postCount,
    draftCount,
    affiliateCount,
    pendingJobs,
    trafficData,
    ga4Stats,
    realtimeUsers,
    topPages,
  ] =
    await Promise.all([
      prisma.post.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      prisma.post.count({ where: { status: "DRAFT",     deletedAt: null } }),
      prisma.affiliateLink.count({ where: { isActive: true } }),
      prisma.aiJob.count({ where: { status: "PENDING" } }),
      fetchTrafficTrend({ startDate: "30daysAgo", endDate: "today" }).catch(() => []),
      fetchBasicStatsLast7Days().catch(() => null),
      fetchRealtimeActiveUsers().catch(() => 0),
      fetchTopPagesLast7Days().catch(() => []),
    ]);
  const integrationStatuses = getGoogleIntegrationStatuses();

  const stats = [
    { label: "已發布文章", value: postCount,       icon: FileText,     color: "blue"   },
    { label: "草稿",       value: draftCount,       icon: FileText,     color: "yellow" },
    { label: "聯盟連結",   value: affiliateCount,   icon: Link2,        color: "green"  },
    { label: "AI 等待中",  value: pendingJobs,      icon: BrainCircuit, color: "purple" },
  ] as const;

  const ga4Cards = [
    { label: "GA4 即時使用者", value: realtimeUsers, icon: Activity, color: "green" },
    { label: "GA4 7天 Sessions", value: ga4Stats?.sessions ?? 0, icon: Users, color: "blue" },
    { label: "GA4 7天瀏覽量", value: ga4Stats?.screenPageViews ?? 0, icon: Eye, color: "purple" },
    { label: "GA4 7天活躍使用者", value: ga4Stats?.activeUsers ?? 0, icon: Users, color: "yellow" },
  ] as const;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">儀表板</h1>

      {/* 快速統計卡片 */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">統計摘要</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              color={s.color}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="ga4-heading" className="mt-8">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="ga4-heading" className="text-base font-semibold text-gray-900">
              GA4 串流摘要
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Measurement ID：{env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "未設定"} / Property ID：{env.GA4_PROPERTY_ID}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {ga4Cards.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              color={s.color}
            />
          ))}
        </div>
      </section>

      {/* 流量趨勢圖 */}
      <section
        aria-labelledby="traffic-heading"
        className="mt-8 rounded-xl border border-gray-200 bg-white p-6"
      >
        <h2 id="traffic-heading" className="mb-4 text-base font-semibold text-gray-900">
          近 30 天流量趨勢
        </h2>
        <TrafficChart data={trafficData} />
      </section>

      <section
        aria-labelledby="top-pages-heading"
        className="mt-8 rounded-xl border border-gray-200 bg-white p-6"
      >
        <h2 id="top-pages-heading" className="mb-4 text-base font-semibold text-gray-900">
          GA4 近 7 天熱門頁面
        </h2>
        {topPages.length === 0 ? (
          <p className="text-sm text-gray-400">尚無熱門頁面資料，或 GA4 Reporting API 尚未回傳數據。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th scope="col" className="pb-2 pr-4 font-medium">頁面</th>
                  <th scope="col" className="pb-2 pr-4 font-medium">路徑</th>
                  <th scope="col" className="pb-2 pr-4 text-right font-medium">瀏覽</th>
                  <th scope="col" className="pb-2 text-right font-medium">使用者</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topPages.map((page) => (
                  <tr key={`${page.path}-${page.title}`}>
                    <td className="max-w-xs truncate py-2 pr-4 text-gray-700">{page.title}</td>
                    <td className="max-w-xs truncate py-2 pr-4 text-gray-400">{page.path}</td>
                    <td className="py-2 pr-4 text-right font-semibold text-gray-800">{page.views.toLocaleString()}</td>
                    <td className="py-2 text-right text-gray-500">{page.users.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        aria-labelledby="google-integrations-heading"
        className="mt-8 rounded-xl border border-gray-200 bg-white p-6"
      >
        <h2 id="google-integrations-heading" className="mb-4 text-base font-semibold text-gray-900">
          Google 平台串接狀態
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {integrationStatuses.map((item) => (
            <article key={item.name} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    item.status === "connected"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700",
                  ].join(" ")}
                >
                  {item.status === "connected" ? "已設定" : "待補權限"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
              {item.missing.length > 0 && (
                <p className="mt-2 break-all text-xs text-gray-400">
                  缺少：{item.missing.join(", ")}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* 最近 AI Jobs */}
      <section
        aria-labelledby="ai-jobs-heading"
        className="mt-8 rounded-xl border border-gray-200 bg-white p-6"
      >
        <h2 id="ai-jobs-heading" className="mb-4 text-base font-semibold text-gray-900">
          最近 AI 任務
        </h2>
        <RecentAiJobs />
      </section>
    </div>
  );
}

// ── 最近 AI Jobs 子元件（Server Component）──────────────

async function RecentAiJobs() {
  const jobs = await prisma.aiJob.findMany({
    orderBy: { createdAt: "desc" },
    take:    10,
    select: {
      id: true, type: true, status: true,
      retryCount: true, createdAt: true,
    },
  });

  const STATUS_COLOR: Record<string, string> = {
    PENDING:     "bg-yellow-100 text-yellow-700",
    PROCESSING:  "bg-blue-100   text-blue-700",
    DONE:        "bg-green-100  text-green-700",
    FAILED:      "bg-red-100    text-red-700",
    DEAD_LETTER: "bg-gray-100   text-gray-700",
  };

  if (jobs.length === 0) {
    return <p className="text-sm text-gray-400">尚無 AI 任務紀錄</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm" aria-label="AI 任務列表">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
            <th scope="col" className="pb-2 pr-4 font-medium">任務類型</th>
            <th scope="col" className="pb-2 pr-4 font-medium">狀態</th>
            <th scope="col" className="pb-2 pr-4 font-medium">重試次數</th>
            <th scope="col" className="pb-2 font-medium">建立時間</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {jobs.map((job) => (
            <tr key={job.id} className="py-2">
              <td className="py-2 pr-4 text-gray-700">{job.type}</td>
              <td className="py-2 pr-4">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[job.status] ?? ""}`}>
                  {job.status}
                </span>
              </td>
              <td className="py-2 pr-4 text-gray-500">{job.retryCount}</td>
              <td className="py-2 text-gray-400">
                {job.createdAt.toLocaleString("zh-TW")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
