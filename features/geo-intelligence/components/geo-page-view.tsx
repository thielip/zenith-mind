"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { GeoPayload } from "@/server/command-center/load-geo";
import { DemoBanner } from "@/shared/ui/demo-banner";

export function GeoPageView({ data }: { data: GeoPayload }) {
  return (
    <ModuleShell
      title="GEO 情報"
      description="生成式引擎能見度、Share of Voice 與 AI 引用"
      kpis={data.kpis}
      headerExtra={
        data.isDemo ? (
          <DemoBanner
            title="Demo 示範資料 / 待接 API"
            description="請設定 OTTERLY_API_KEY 或 SEMRUSH_API_KEY 以顯示各 AI 引擎即時能見度。"
          />
        ) : data.note ? (
          <DemoBanner
            title="GSC + 站內真實指標"
            description={data.note}
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
          />
        ) : null
      }
      sections={[
        {
          title: "能見度來源（真實數據）",
          content: (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2 text-left">來源</th>
                  <th className="pb-2 text-right">能見度</th>
                  <th className="pb-2 text-right">SoV / 參考</th>
                  <th className="pb-2 text-right">點擊/引用</th>
                </tr>
              </thead>
              <tbody>
                {data.engines.map((e) => (
                  <tr key={e.name} className="border-t border-slate-800/60">
                    <td className="py-2 text-slate-200">{e.name}</td>
                    <td className="py-2 text-right font-mono">{e.visibility}</td>
                    <td className="py-2 text-right font-mono">{e.shareOfVoice}</td>
                    <td className="py-2 text-right font-mono">{e.citations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        },
      ]}
    />
  );
}
