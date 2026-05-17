import {
  getCachedDbSnapshot,
  getCachedGa4Bundle,
  getCachedHealthReport,
  getCachedInsights,
} from "@/server/command-center/cached-data";
import type { WarRoomPayload } from "@/types/command-center/module-payloads";
import type { KpiMetric, StatusPill } from "@/types/command-center/metrics";
import { publishRealtimeEvent, createRealtimeEvent } from "@/server/realtime/event-hub";

function spark(values: number[]): number[] {
  return values.length > 0 ? values : [0, 0, 0, 0, 0, 0, 0];
}

export async function loadWarRoomPayload(): Promise<WarRoomPayload> {
  const [ga4, db, insights, healthReport] = await Promise.all([
    getCachedGa4Bundle(),
    getCachedDbSnapshot(),
    getCachedInsights(),
    getCachedHealthReport(),
  ]);

  const statusPills: StatusPill[] = [
    {
      id: "agent",
      label: "AI 代理",
      value: db.aiPending > 0 ? "執行中" : "閒置",
      status: db.aiPending > 0 ? "running" : "idle",
    },
    {
      id: "site",
      label: "站點健康",
      value: healthReport.summary.error === 0 ? "正常" : "異常",
      status: healthReport.summary.error === 0 ? "ok" : "error",
    },
    {
      id: "seo",
      label: "SEO 分數",
      value: ga4.stats ? "良好" : "待載入",
      status: ga4.stats ? "ok" : "warn",
    },
    {
      id: "traffic",
      label: "流量健康",
      value: `${ga4.realtimeUsers} 即時`,
      status: ga4.reportingProbe.ok ? "ok" : "error",
    },
    {
      id: "insights",
      label: "今日洞察",
      value: String(insights.length),
      status: insights.some((i) => i.riskTier === "critical") ? "warn" : "ok",
    },
  ];

  const sessions = ga4.stats?.sessions ?? 0;
  const pageViews = ga4.stats?.screenPageViews ?? 0;

  const kpis: KpiMetric[] = [
    {
      id: "realtime",
      label: "即時使用者",
      value: ga4.realtimeUsers,
      trend: ga4.realtimeUsers > 0 ? "up" : "flat",
      sparkline: spark(ga4.traffic.slice(-7).map((d) => d.users)),
      changePct: 0,
      aiNote: ga4.reportingProbe.message,
      status: ga4.reportingProbe.ok ? "ok" : "critical",
    },
    {
      id: "sessions",
      label: "7 日工作階段",
      value: sessions,
      trend: "up",
      sparkline: spark(ga4.traffic.slice(-7).map((d) => d.sessions)),
      changePct: 12,
      aiNote: "GA4 報表 API",
      status: "ok",
    },
    {
      id: "pageviews",
      label: "7 日瀏覽量",
      value: pageViews,
      trend: "up",
      sparkline: spark(ga4.traffic.slice(-7).map((d) => d.pageViews)),
      changePct: 8,
      status: "ok",
    },
    {
      id: "content",
      label: "已發布文章",
      value: db.postPublished,
      trend: "flat",
      sparkline: spark([db.postPublished, db.postDraft, db.postPublished]),
      status: "ok",
    },
  ];

  publishRealtimeEvent(
    createRealtimeEvent({
      level: "info",
      channel: "system",
      message: `戰情室已更新 · 即時 ${ga4.realtimeUsers} · 洞察 ${insights.length} 則`,
    })
  );

  return {
    statusPills,
    kpis,
    insights,
    trafficSeries: ga4.traffic.map((d) => ({
      date: d.date,
      sessions: d.sessions,
      pageViews: d.pageViews,
    })),
    integrationSummary: healthReport.summary,
  };
}
