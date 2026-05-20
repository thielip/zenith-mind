"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { ModuleHeader } from "@/widgets/command-shell/module-header";
import { KpiMetricCard } from "@/widgets/kpi-grid/kpi-metric-card";
import { GlassCard } from "@/shared/ui/glass-card";
import { CcProgressBar } from "@/widgets/command-center/cc-progress-bar";
import { CcHealthBadge } from "@/widgets/command-center/cc-health-badge";
import {
  clsHealth,
  inpHealth,
  lcpHealth,
} from "@/widgets/command-center/cc-health";
import { CcWarningAlert } from "@/widgets/command-center/cc-warning-alert";
import { CcAiInsightBlock } from "@/widgets/command-center/cc-ai-insight-block";
import type { SeoPayload } from "@/types/command-center/module-payloads";

const CcDonutChart = dynamic(
  () =>
    import("@/widgets/command-center/cc-donut-chart").then((m) => m.CcDonutChart),
  { ssr: false, loading: () => <div className="h-44 animate-pulse rounded-lg bg-slate-800/40" /> }
);

const KEYWORD_PAGE_SIZE = 8;

function isGscCredentialError(message?: string): boolean {
  if (!message) return false;
  return /invalid_grant|invalid jwt|jwt signature|unauthorized|認證/i.test(message);
}

function SeoKeywordsTable({
  keywords,
  showGscWarning,
  gscMessage,
}: {
  keywords: SeoPayload["keywords"];
  showGscWarning: boolean;
  gscMessage?: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(keywords.length / KEYWORD_PAGE_SIZE));
  const slice = keywords.slice(
    page * KEYWORD_PAGE_SIZE,
    page * KEYWORD_PAGE_SIZE + KEYWORD_PAGE_SIZE
  );

  return (
    <GlassCard className="flex h-full flex-col p-4" glow="cyan">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">關鍵字 (28D)</h2>
        <span className="font-mono text-xs text-slate-500">
          {keywords.length} 筆
        </span>
      </div>
      {showGscWarning ? (
        <CcWarningAlert
          title="Search Console 資料無法載入"
          message={
            gscMessage ??
            "GSC 憑證可能已失效（例如 invalid_grant: Invalid JWT Signature），目前點擊與曝光顯示為 0。"
          }
          className="mb-4"
        />
      ) : null}
      <div className="min-h-0 flex-1 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2 pr-2">查詢</th>
              <th className="pb-2 text-right">點擊</th>
              <th className="pb-2 text-right">曝光</th>
              <th className="pb-2 text-right">CTR</th>
              <th className="pb-2 text-right">排名</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  尚無關鍵字資料
                </td>
              </tr>
            ) : (
              slice.map((k) => (
                <tr key={k.query} className="border-t border-slate-800/60">
                  <td className="max-w-[200px] truncate py-2.5 pr-2 text-slate-200">
                    {k.query}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-100">
                    {k.clicks.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-400">
                    {k.impressions.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    {(k.ctr * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 text-right font-mono text-cyan-200/90">
                    {k.position.toFixed(1)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {keywords.length > KEYWORD_PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-slate-700/80 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200 disabled:opacity-40"
          >
            上一頁
          </button>
          <span className="font-mono text-xs text-slate-500">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-40"
          >
            查看更多
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </GlassCard>
  );
}

function SeoCwvPanel({ data }: { data: SeoPayload }) {
  const lcp = lcpHealth(data.cwv.lcp);
  const inp = inpHealth(data.cwv.inp);
  const cls = clsHealth(data.cwv.cls);
  const indexed = data.indexCoverage;
  const notIndexed = Math.max(0, 100 - indexed);

  return (
    <GlassCard className="flex h-full flex-col p-4">
      <h2 className="mb-4 text-sm font-semibold text-white">Core Web Vitals</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">LCP</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-slate-200">{data.cwv.lcp}s</span>
            <CcHealthBadge health={lcp} />
          </div>
        </div>
        <CcProgressBar value={data.cwv.lcp} max={4} health={lcp} />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">INP</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-slate-200">{data.cwv.inp}ms</span>
            <CcHealthBadge health={inp} />
          </div>
        </div>
        <CcProgressBar value={data.cwv.inp} max={500} health={inp} />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">CLS</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-slate-200">{data.cwv.cls}</span>
            <CcHealthBadge health={cls} />
          </div>
        </div>
        <CcProgressBar value={data.cwv.cls * 100} max={25} health={cls} />
      </div>
      <div className="mt-6 border-t border-slate-800/60 pt-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          索引覆蓋率
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <CcDonutChart
            segments={[
              { name: "已索引", value: indexed, color: "#34D399" },
              { name: "未覆蓋", value: notIndexed, color: "#334155" },
            ]}
            centerValue={`${indexed}%`}
            centerLabel="覆蓋"
            size={140}
          />
          <ul className="flex flex-col justify-center space-y-2 text-xs">
            <li className="flex justify-between text-emerald-400">
              <span>已索引</span>
              <span className="font-mono">{indexed}%</span>
            </li>
            <li className="flex justify-between text-slate-500">
              <span>404 錯誤</span>
              <span className="font-mono">{data.errorHealth.notFound}</span>
            </li>
            <li className="flex justify-between text-slate-500">
              <span>伺服器錯誤</span>
              <span className="font-mono">{data.errorHealth.serverError}</span>
            </li>
          </ul>
        </div>
      </div>
    </GlassCard>
  );
}

function LandingPagesTable({
  pages,
}: {
  pages: SeoPayload["landingPages"];
}) {
  const rows = pages.slice(0, 6);

  return (
    <GlassCard className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">熱門登陸頁面 (28D)</h2>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="pb-2">頁面</th>
            <th className="pb-2 text-right">點擊</th>
            <th className="pb-2 text-right">曝光</th>
            <th className="pb-2 text-right">趨勢</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-center text-slate-500">
                尚無登陸頁資料
              </td>
            </tr>
          ) : (
            rows.map((p) => {
              const trendUp = p.impressions > 0 && p.clicks / p.impressions > 0.02;
              return (
                <tr key={p.path} className="border-t border-slate-800/60">
                  <td className="max-w-[280px] truncate py-2.5 font-mono text-slate-300">
                    {p.path}
                  </td>
                  <td className="py-2.5 text-right font-mono">{p.clicks}</td>
                  <td className="py-2.5 text-right font-mono text-slate-400">
                    {p.impressions.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right">
                    {trendUp ? (
                      <TrendingUp className="ml-auto h-4 w-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="ml-auto h-4 w-4 text-amber-400/80" />
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </GlassCard>
  );
}

export function SeoPageView({ data }: { data: SeoPayload }) {
  const showGscWarning = useMemo(() => {
    if (!data.gscOk) return true;
    if (isGscCredentialError(data.gscMessage)) return true;
    const gscKpi = data.kpis.find((k) => k.id === "gsc-clicks");
    if (
      gscKpi &&
      gscKpi.value === 0 &&
      gscKpi.aiNote &&
      isGscCredentialError(gscKpi.aiNote)
    ) {
      return true;
    }
    return false;
  }, [data]);

  const seoInsights = useMemo(
    () => [
      {
        title: "Meta Description 優化",
        body: "部分高曝光關鍵字 CTR 低於站均，建議為對應登陸頁補上 150–160 字元描述並加入主要關鍵字。",
        priority: "medium" as const,
      },
      {
        title: "排名下滑頁面",
        body: "監測到 2 個查詢平均排名較上週下降 1.2 位，可檢視內容新鮮度與內部連結。",
        priority: "high" as const,
      },
      {
        title: "CWV 維持良好",
        body: "LCP / INP / CLS 均在良好區間，建議持續使用 Supabase 圖片 render 以維持 LCP。",
        priority: "low" as const,
      },
    ],
    []
  );

  return (
    <div className="space-y-6 min-w-0">
      <ModuleHeader
        title="SEO 情報"
        description="Search Console、GA4 自然流量、CWV 與索引健康"
      />
      {showGscWarning && !data.keywords.length ? (
        <CcWarningAlert
          title="GSC 串接異常"
          message={
            data.gscMessage ??
            "無法取得 Search Console 資料，請至串接設定更新 OAuth 或服務帳號憑證。"
          }
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => (
          <KpiMetricCard key={k.id} metric={k} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <SeoKeywordsTable
          keywords={data.keywords}
          showGscWarning={showGscWarning}
          gscMessage={data.gscMessage}
        />
        <SeoCwvPanel data={data} />
      </div>
      <LandingPagesTable pages={data.landingPages} />
      <CcAiInsightBlock
        title="AI 智慧診斷與行動建議"
        subtitle="依 GSC、CWV 與站內結構化訊號產生的優先改善項目（示範建議）"
        items={seoInsights}
      />
    </div>
  );
}
