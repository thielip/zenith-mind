"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { AeoPayload } from "@/server/command-center/load-aeo";
import { DemoBanner } from "@/shared/ui/demo-banner";

export function AeoPageView({ data }: { data: AeoPayload }) {
  const hasDemoMetrics = data.metrics.some((m) => m.source === "demo");

  return (
    <ModuleShell
      title="AEO 情報"
      description="回答引擎優化、Schema 與站內 FAQ 結構化覆蓋"
      kpis={data.kpis}
      headerExtra={
        <DemoBanner
          title={
            data.isLiveGsc && !hasDemoMetrics
              ? "站內 + Search Console 真實數據"
              : "站內真實指標 + GSC 待連線"
          }
          description={
            data.isLiveGsc
              ? "FAQ / SEO Meta 來自已發布文章；Featured Snippets / Rich Results 來自 GSC searchAppearance（28 日）。"
              : `FAQ / SEO Meta 為站內真實數據。GSC：${data.gscMessage ?? "尚未連線"}`
          }
          className={
            data.isLiveGsc && !hasDemoMetrics
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
              : undefined
          }
        />
      }
      sections={[
        {
          title: "AEO 指標",
          content: (
            <ul className="space-y-2 font-mono text-sm text-slate-300">
              {data.metrics.map((m) => (
                <li key={m.name} className="flex flex-wrap items-center gap-2">
                  <span>
                    {m.name}: {m.value.toLocaleString()} {m.unit}
                  </span>
                  <span
                    className={
                      m.source === "live"
                        ? "rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300"
                        : "rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300"
                    }
                  >
                    {m.source === "live" ? "真實" : "待 GSC"}
                  </span>
                </li>
              ))}
            </ul>
          ),
        },
        ...(data.appearances.length > 0
          ? [
              {
                title: "GSC 搜尋外觀 (28D)",
                content: (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="pb-2 text-left">外觀類型</th>
                        <th className="pb-2 text-right">曝光</th>
                        <th className="pb-2 text-right">點擊</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.appearances.map((a) => (
                        <tr key={a.appearance} className="border-t border-slate-800/60">
                          <td className="py-2 text-slate-200">{a.appearance}</td>
                          <td className="py-2 text-right font-mono">
                            {a.impressions.toLocaleString()}
                          </td>
                          <td className="py-2 text-right font-mono">
                            {a.clicks.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
