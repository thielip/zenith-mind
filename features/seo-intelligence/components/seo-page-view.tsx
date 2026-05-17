"use client";

import { ModuleHeader } from "@/widgets/command-shell/module-header";
import { KpiMetricCard } from "@/widgets/kpi-grid/kpi-metric-card";
import { GlassCard } from "@/shared/ui/glass-card";
import type { SeoPayload } from "@/types/command-center/module-payloads";

export function SeoPageView({ data }: { data: SeoPayload }) {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="SEO 情報"
        description="Search Console、GA4 自然流量、CWV 與索引健康"
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => (
          <KpiMetricCard key={k.id} metric={k} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">關鍵字 (28D)</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2">查詢</th>
                <th className="pb-2 text-right">點擊</th>
                <th className="pb-2 text-right">CTR</th>
              </tr>
            </thead>
            <tbody>
              {data.keywords.map((k) => (
                <tr key={k.query} className="border-t border-slate-800/60">
                  <td className="py-2 text-slate-200">{k.query}</td>
                  <td className="py-2 text-right font-mono">{k.clicks}</td>
                  <td className="py-2 text-right font-mono">
                    {(k.ctr * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
        <GlassCard className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Core Web Vitals</h2>
          <ul className="space-y-2 font-mono text-sm text-slate-300">
            <li>LCP: {data.cwv.lcp}s</li>
            <li>INP: {data.cwv.inp}ms</li>
            <li>CLS: {data.cwv.cls}</li>
            <li>索引覆蓋: {data.indexCoverage}%</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
